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
    window.console && window.console.log(e);
  }
};

function getDefaults() {
  return {
    lastUsedPath: 'https://api.locize.io/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
    referenceLng: 'en',
    crossDomain: true,
    setContentTypeJSON: false,
    version: 'latest',
    debounceSubmit: 90000,
    allowedHosts: ['localhost']
  };
}

const locizeLastUsed = {
  init: function(options) {
    const isI18next = options.t && typeof options.t === 'function';

    this.options = isI18next ? { ...getDefaults(), ...this.options, ...options.options.locizeLastUsed } : { ...getDefaults(), ...this.options, ...options };

    const hostname = window.location && window.location.hostname;
    if (hostname) {
      this.isAllowed = this.options.allowedHosts.indexOf(hostname) > -1;
    } else {
      this.isAllowed = true;
    }

    this.submitting = null;
    this.pending = {};
    this.done = {};
    
    if (!this.options.projectId || this.options.projectId === 'projectid' || this.options.projectId === 'projectId') {
      const err = new Error('projectId is not valid');
      console.error(err);
      throw err;
    }

    this.submit = utils.debounce(this.submit, this.options.debounceSubmit);

    // intercept
    if (isI18next) this.interceptI18next(options);
  },

  interceptI18next: function(i18next) {
    const origGetResource = i18next.services.resourceStore.getResource;

    i18next.services.resourceStore.getResource = (lng, ns, key, options) => {
      // call last used
      if (key) this.used(ns, key);

      // by pass orginal call
      return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options);
    }
  },

  used: function(ns, key) {
    ['pending', 'done'].forEach((k) => {
      if (this.done[ns] && this.done[ns][key]) return;
      if (!this[k][ns]) this[k][ns] = {};
      this[k][ns][key] = true;
    });

    this.submit();
  },

  submit: function() {
    if (!this.isAllowed) return;
    if (this.submitting) return this.submit();
    this.submitting = this.pending;
    this.pending = {};

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
      let url = utils.replaceIn(this.options.lastUsedPath, ['projectId', 'version', 'lng', 'ns'], { ...this.options, lng: this.options.referenceLng, ns });

      if (keys.length) {
        ajax(url, { ...{ authorize: true }, ...this.options }, (data, xhr) => { doneOne(); }, keys);
      } else {
        doneOne();
      }
    });
  }
}

locizeLastUsed.type = '3rdParty';

export default locizeLastUsed;
