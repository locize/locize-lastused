const arr = []
const each = arr.forEach
const slice = arr.slice

export function defaults (obj) {
  each.call(slice.call(arguments, 1), (source) => {
    if (source) {
      for (const prop in source) {
        if (obj[prop] === undefined) obj[prop] = source[prop]
      }
    }
  })
  return obj
}

export function debounce (func, wait, immediate) {
  let timeout
  return function () {
    const context = this; const args = arguments
    const later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

export function isMissingOption (obj, props) {
  return props.reduce((mem, p) => {
    if (mem) return mem
    if (!obj || !obj[p] || typeof obj[p] !== 'string' || !obj[p].toLowerCase() === p.toLowerCase()) {
      const err = `i18next-lastused :: got "${obj[p]}" in options for ${p} which is invalid.`
      console.warn(err)
      return err
    }
    return false
  }, false)
}

export function replaceIn (str, arr, options) {
  let ret = str
  arr.forEach(s => {
    const regexp = new RegExp(`{{${s}}}`, 'g')
    ret = ret.replace(regexp, options[s])
  })
  return ret
}
