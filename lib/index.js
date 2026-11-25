import { defaults, replaceIn, isMissingOption } from './utils.js'
import request from './request.js'

const getDefaults = () => {
  return {
    lastUsedPath: 'https://api.locize.app/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
    referenceLng: 'en',
    crossDomain: true,
    setContentTypeJSON: false,
    version: 'latest',
    debounceSubmit: 90000,
    // a key looked up again this long after it was sent is sent again, so a page or a server that
    // runs for days keeps its keys' last use current (the API stores a newer last use only once the
    // stored one is more than 12 hours old; a few minutes more keep a resend clear of that line)
    resubmitAfter: 12 * 60 * 60 * 1000 + 5 * 60 * 1000,
    allowedHosts: ['localhost']
  }
}

const locizeLastUsed = {
  init (options) {
    const isI18next = options.t && typeof options.t === 'function'

    if (isI18next && !options.options.locizeLastUsed.projectId && options.options.backend.projectId) {
      options.options.locizeLastUsed.projectId = options.options.backend.projectId
    }
    if (isI18next && !options.options.locizeLastUsed.version && options.options.backend.version) {
      options.options.locizeLastUsed.version = options.options.backend.version
    }
    if (isI18next && !options.options.locizeLastUsed.apiKey && options.options.backend.apiKey) {
      options.options.locizeLastUsed.apiKey = options.options.backend.apiKey
    }
    if (isI18next && !options.options.locizeLastUsed.referenceLng && options.options.backend.referenceLng) {
      options.options.locizeLastUsed.referenceLng = options.options.backend.referenceLng
    }
    if (isI18next && !options.options.locizeLastUsed.referenceLng && options.options.fallbackLng && Array.isArray(options.options.fallbackLng) && options.options.fallbackLng[0] !== 'dev') {
      options.options.locizeLastUsed.referenceLng = options.options.fallbackLng[0]
    }

    this.options = isI18next ? defaults(options.options.locizeLastUsed, this.options || {}, getDefaults()) : defaults(options, this.options || {}, getDefaults())

    const hostname = typeof window !== 'undefined' && window.location && window.location.hostname
    if (hostname) {
      this.isAllowed = this.options.allowedHosts.indexOf(hostname) > -1
    } else {
      this.isAllowed = true
    }

    // what waits for the previous settings is not sent with the new ones: its callbacks are called
    // now, and a send still running for them changes nothing here when it ends
    if (this.callbacks) this.callbacks.splice(0).forEach((callback) => callback(new Error('locize-lastused: init() was called again before these keys were sent')))
    // maps without a prototype: a namespace or key named `__proto__` must stay a plain entry
    clearTimeout(this.timer)
    this.timer = null
    this.sending = false
    this.pending = Object.create(null) // ns -> key -> attempt (1, or 2 for the retry)
    this.callbacks = [] // of the keys in `pending`
    this.sentAt = Object.create(null) // ns -> key -> when it was queued

    // a page that closes (or goes to the background, where it may be discarded) before the timer
    // runs sends what is waiting now, with keepalive so the request outlives the page
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.addEventListener && !this.listening) {
      this.listening = true
      const flush = () => this.send(true)
      window.addEventListener('pagehide', flush)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush()
      })
    }

    // intercept
    if (isI18next) this.interceptI18next(options)
  },

  interceptI18next (i18next) {
    const origGetResource = i18next.services.resourceStore.getResource

    i18next.services.resourceStore.getResource = (lng, ns, key, options) => {
      // call last used
      if (key) this.used(ns, key)

      // by pass orginal call
      return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options)
    }
  },

  used (ns, key, callback) {
    if (!this.isAllowed) return callback && callback(new Error('not allowed'))
    const now = Date.now()
    const sentAt = this.sentAt[ns] && this.sentAt[ns][key]
    if (sentAt && now - sentAt < this.options.resubmitAfter) return callback && callback()

    if (!this.sentAt[ns]) this.sentAt[ns] = Object.create(null)
    this.sentAt[ns][key] = now
    this.queue(ns, [key], 1)
    if (callback) this.callbacks.push(callback)
    this.schedule()
  },

  queue (ns, keys, attempt) {
    if (!this.pending[ns]) this.pending[ns] = Object.create(null)
    keys.forEach((key) => { this.pending[ns][key] = attempt })
  },

  // The first key waiting starts the timer and later ones do not restart it: a page that keeps
  // translating, or keeps finding new keys, still sends once per `debounceSubmit`.
  schedule () {
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.send()
    }, this.options.debounceSubmit)
  },

  send (keepalive) {
    const namespaces = Object.keys(this.pending)
    if (!namespaces.length) return
    // one send at a time (the running one schedules what waits when it ends); a page that is
    // closing cannot wait for it and sends beside it
    if (this.sending && !keepalive) return

    const batch = this.pending
    const callbacks = this.callbacks
    const options = this.options
    this.pending = Object.create(null)
    this.callbacks = []
    const finish = (err) => callbacks.forEach((callback) => callback(err))

    if (!this.isAllowed) return finish(new Error('not allowed'))
    const isMissing = isMissingOption(this.options, ['projectId', 'version', 'apiKey', 'referenceLng'])
    if (isMissing) return finish(new Error(isMissing))

    if (!keepalive) this.sending = true
    // browsers refuse keepalive requests once their bodies together pass 64 KiB
    let keepaliveBudget = keepalive ? 60 * 1024 : 0
    let todo = namespaces.length
    let lastError
    const doneOne = (ns, keys) => (err, res) => {
      const status = res && res.status
      // decided on the status, not on `err`: XMLHttpRequest reports an error by its statusText
      // (empty under HTTP/2) and no answer at all as status 0 without an error
      const noAnswer = !status && (!!err || status === 0)
      // an init() since this send started: its answer changes nothing of the new settings
      const current = this.options === options
      if (!current) {
        // nothing to keep or stop
      } else if ((status === 401 || status === 403) && this.isAllowed) {
        // a refused key (401: no write access; 403: a plan limit) will be refused again: say so once, stop for this page
        this.isAllowed = false
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(`locize-lastused: stopped sending last used information on this page, the locize API answered ${status} ${err || ''}. A 401 means the api key has no write access (it needs the role "user" or "admin"); lastused belongs on development or staging, never in production.`)
        }
      } else if (noAnswer || status === 429 || status >= 500) {
        // keep the keys for one more send; a second failure drops them (they go out again when looked
        // up after resubmitAfter), so a host that is down or blocked is not asked every interval
        const again = keys.filter((key) => batch[ns][key] < 2)
        if (again.length) this.queue(ns, again, 2)
      }
      if (noAnswer || status >= 400) lastError = err || new Error(`locize-lastused: the locize API answered ${status}`)
      todo--
      if (todo) return
      if (current && !keepalive) this.sending = false
      if (current && Object.keys(this.pending).length) this.schedule()
      // later, outside the request's promise: a callback that throws must not end this send twice
      setTimeout(() => finish(lastError))
    }
    namespaces.forEach((ns) => {
      const keys = Object.keys(batch[ns])
      const url = replaceIn(this.options.lastUsedPath, ['projectId', 'version', 'lng', 'ns'], defaults({ lng: this.options.referenceLng, ns }, this.options))
      const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(JSON.stringify(keys)).length : Infinity
      const useKeepalive = bytes <= keepaliveBudget
      if (useKeepalive) keepaliveBudget -= bytes
      request(defaults({ authorize: true, keepalive: useKeepalive }, this.options), url, keys, doneOne(ns, keys))
    })
  }
}

locizeLastUsed.type = '3rdParty'

export default locizeLastUsed
