import * as utils from './utils';

// https://gist.github.com/Xeoncross/7663273
function ajax(url, options, callback, data, cache) {
  try {
    var x = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    x.open(data ? 'POST' : 'GET', url, 1);
    if (!options.crossDomain) {
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
    if (options.authorize && options.apiKey) {
      x.setRequestHeader('Authorization', options.apiKey);
    }
    if (data || options.setContentTypeJSON) {
      x.setRequestHeader('Content-type', 'application/json');
    }
    x.onreadystatechange = function() {
      x.readyState > 3 && callback && callback(x.responseText, x);
    };
    x.send(JSON.stringify(data));
  } catch (e) {
    window.console && console.log(e);
  }
};

function getDefaults() {
  return {
    lastUsedPath: 'https://api.locize.io/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
    referenceLng: 'en',
    crossDomain: true,
    setContentTypeJSON: false,
    version: 'latest',
    debounceSubmit: '90000'
  };
}

class LocizeLastUsed {
  constructor(options = {}) {
    this.init(options);

    this.type = '3rdParty';
  }

  init(options) {
    const isI18next = options.t && typeof options.t === 'function';

    this.options = isI18next ? { ...getDefaults(), ...this.options, ...options.options.locizeLastUsed } : { ...getDefaults(), ...this.options, ...options };

    this.submitting = null;
    this.pending = {};
    this.done = {};

    this.submit = utils.debounce(this.submit, this.options.debounceSubmit);

    // intercept
    if (isI18next) this.interceptI18next(i18next);
  }

  interceptI18next(i18next) {
    const origGetResource = i18next.services.resourceStore.getResource;

    i18next.services.resourceStore.getResource = (lng, ns, key, options) => {
      // call last used
      this.used(ns, key);

      // by pass orginal call
      return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options);
    }
  }

  used(ns, key) {
    ['pending', 'done'].forEach((k) => {
      if (this.done[ns] && this.done[ns][key]) return;
      if (!this[k][ns]) this[k][ns] = {};
      this[k][ns][key] = true;
    });

    this.submit();
  }

  submit() {
    if (this.submitting) return this.submit();
    this.submitting = this.pending;
    this.pending = {};

    let url = utils.replaceIn(this.options.lastUsedPath, { ...this.options, lng: this.options.referenceLng });

    const namespaces = Object.keys(this.submitting);

    let todo = namespaces.length;
    const doneOne = () => {
      todo--;

      if (!todo) {
        this.submitting = null;
      }
    }
    namespaces.forEach((ns) => {
      const keys = Object.keys(this.submitting[ns]);

      if (keys.length) {
        ajax(url, { ...{ authorize: true }, ...this.options }, (data, xhr) => { doneOne(); }, keys);
      } else {
        doneOne();
      }
    });
  }
}

LocizeLastUsed.type = '3rdParty';

export default LocizeLastUsed;
