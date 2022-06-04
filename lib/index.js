import { defaults, replaceIn, debounce, isMissingOption } from './utils.js'
import request from './request.js'

const getDefaults = () => {
  return {
    lastUsedPath: 'https://api.locize.app/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
    referenceLng: 'en',
    crossDomain: true,
    setContentTypeJSON: false,
    version: 'latest',
    debounceSubmit: 90000,
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

    this.submitting = null
    this.pending = {}
    this.done = {}

    this.submit = debounce(this.submit, this.options.debounceSubmit)

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
    ['pending', 'done'].forEach((k) => {
      if (this.done[ns] && this.done[ns][key]) return
      if (!this[k][ns]) this[k][ns] = {}
      this[k][ns][key] = true
    })

    this.submit(callback)
  },

  submit (callback) {
    if (!this.isAllowed) return callback && callback(new Error('not allowed'))
    if (this.submitting) return this.submit(callback)

    // missing options
    const isMissing = isMissingOption(this.options, ['projectId', 'version', 'apiKey', 'referenceLng'])
    if (isMissing) return callback && callback(new Error(isMissing))

    this.submitting = this.pending
    this.pending = {}

    const namespaces = Object.keys(this.submitting)

    let todo = namespaces.length
    const doneOne = (err) => {
      todo--
      if (!todo) {
        this.submitting = null
        if (callback) callback(err)
      }
    }
    namespaces.forEach((ns) => {
      const keys = Object.keys(this.submitting[ns])
      const url = replaceIn(this.options.lastUsedPath, ['projectId', 'version', 'lng', 'ns'], defaults({ lng: this.options.referenceLng, ns }, this.options))

      if (keys.length) {
        request(defaults({ authorize: true }, this.options), url, keys, doneOne)
      } else {
        doneOne()
      }
    })
  }
}

locizeLastUsed.type = '3rdParty'

export default locizeLastUsed
