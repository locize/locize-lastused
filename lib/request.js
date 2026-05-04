// `globalThis` is the standard cross-environment global (Node ≥ 12, all
// modern browsers, Deno, Bun). The `global` / `window` fallbacks remain only
// for embedded JS runtimes that predate the ES2020 spec.
const g = typeof globalThis !== 'undefined'
  ? globalThis
  : typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
      ? window
      : undefined

let fetchApi
if (typeof fetch === 'function') {
  fetchApi = fetch
} else if (g && typeof g.fetch === 'function') {
  fetchApi = g.fetch
}

// XHR / ActiveXObject are picked up if present in the host, but no longer
// polyfilled — v5 dropped the `cross-fetch` ponyfill. Runtimes without
// native `fetch` (or without an XHR-like API) should provide one before
// loading this module.
const hasXMLHttpRequest = typeof XMLHttpRequest === 'function' || typeof XMLHttpRequest === 'object'
const XmlHttpRequestApi = hasXMLHttpRequest && g ? g.XMLHttpRequest : undefined
const ActiveXObjectApi = typeof ActiveXObject === 'function' && g ? g.ActiveXObject : undefined

// fetch api stuff
const requestWithFetch = (options, url, payload, callback) => {
  const resolver = (response) => {
    const resourceNotExisting = response.headers && response.headers.get('x-cache') === 'Error from cloudfront'
    if (!response.ok) return callback(response.statusText || 'Error', { status: response.status, resourceNotExisting })
    response.text().then((data) => {
      callback(null, { status: response.status, data, resourceNotExisting })
    }).catch(callback)
  }
  const headers = {
    Authorization: options.authorize && options.apiKey ? options.apiKey : undefined,
    'Content-Type': 'application/json'
  }
  if (typeof window === 'undefined' && typeof global !== 'undefined' && typeof global.process !== 'undefined' && global.process.versions && global.process.versions.node) {
    headers['User-Agent'] = `locize-lastused (node/${global.process.version}; ${global.process.platform} ${global.process.arch})`
  }
  if (typeof fetch === 'function') { // react-native debug mode needs the fetch function to be called directly (no alias)
    fetch(url, {
      method: payload ? 'POST' : 'GET',
      body: payload ? JSON.stringify(payload) : undefined,
      headers
    }).then(resolver).catch(callback)
  } else {
    fetchApi(url, {
      method: payload ? 'POST' : 'GET',
      body: payload ? JSON.stringify(payload) : undefined,
      headers
    }).then(resolver).catch(callback)
  }
}

// xml http request stuff
const requestWithXmlHttpRequest = (options, url, payload, callback) => {
  try {
    const x = XmlHttpRequestApi ? new XmlHttpRequestApi() : new ActiveXObjectApi('MSXML2.XMLHTTP.3.0')
    x.open(payload ? 'POST' : 'GET', url, 1)
    if (!options.crossDomain) {
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    }
    if (options.authorize && options.apiKey) {
      x.setRequestHeader('Authorization', options.apiKey)
    }
    if (payload || options.setContentTypeJSON) {
      x.setRequestHeader('Content-Type', 'application/json')
    }
    x.onreadystatechange = () => {
      const resourceNotExisting = x.getResponseHeader('x-cache') === 'Error from cloudfront'
      x.readyState > 3 && callback(x.status >= 400 ? x.statusText : null, { status: x.status, data: x.responseText, resourceNotExisting })
    }
    x.send(JSON.stringify(payload))
  } catch (e) {
    console && console.log(e)
  }
}

const request = (options, url, payload, callback) => {
  if (typeof payload === 'function') {
    callback = payload
    payload = undefined
  }
  callback = callback || (() => {})

  if (fetchApi) {
    // use fetch api
    return requestWithFetch(options, url, payload, callback)
  }

  if (XmlHttpRequestApi || ActiveXObjectApi) {
    // use xml http request
    return requestWithXmlHttpRequest(options, url, payload, callback)
  }

  callback(new Error('No fetch and no xhr implementation found!'))
}

export default request
