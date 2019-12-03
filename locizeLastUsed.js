(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.locizeLastUsed = factory());
}(this, (function () { 'use strict';

function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this,
		    args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function replaceIn(str, arr, options) {
	var ret = str;
	arr.forEach(function (s) {
		var regexp = new RegExp('{{' + s + '}}', 'g');
		ret = ret.replace(regexp, options[s]);
	});

	return ret;
}

function isMissingOption(obj, props) {
	return props.reduce(function (mem, p) {
		if (mem) return mem;
		if (!obj || !obj[p] || typeof obj[p] !== 'string' || !obj[p].toLowerCase() === p.toLowerCase()) {
			var err = 'i18next-lastused :: got "' + obj[p] + '" in options for ' + p + ' which is invalid.';
			console.warn(err);
			return err;
		}
		return false;
	}, false);
}

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
    x.onreadystatechange = function () {
      x.readyState > 3 && callback && callback(x.responseText, x);
    };
    x.send(JSON.stringify(data));
  } catch (e) {
    window.console && window.console.log(e);
  }
}

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

var locizeLastUsed = {
  init: function init(options) {
    var isI18next = options.t && typeof options.t === 'function';

    this.options = isI18next ? _extends({}, getDefaults(), this.options, options.options.locizeLastUsed) : _extends({}, getDefaults(), this.options, options);

    var hostname = window.location && window.location.hostname;
    if (hostname) {
      this.isAllowed = this.options.allowedHosts.indexOf(hostname) > -1;
    } else {
      this.isAllowed = true;
    }

    this.submitting = null;
    this.pending = {};
    this.done = {};

    this.submit = debounce(this.submit, this.options.debounceSubmit);

    // intercept
    if (isI18next) this.interceptI18next(options);
  },

  interceptI18next: function interceptI18next(i18next) {
    var _this = this;

    var origGetResource = i18next.services.resourceStore.getResource;

    i18next.services.resourceStore.getResource = function (lng, ns, key, options) {
      // call last used
      if (key) _this.used(ns, key);

      // by pass orginal call
      return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options);
    };
  },

  used: function used(ns, key) {
    var _this2 = this;

    ['pending', 'done'].forEach(function (k) {
      if (_this2.done[ns] && _this2.done[ns][key]) return;
      if (!_this2[k][ns]) _this2[k][ns] = {};
      _this2[k][ns][key] = true;
    });

    this.submit();
  },

  submit: function submit() {
    var _this3 = this;

    if (!this.isAllowed) return;
    if (this.submitting) return this.submit();

    // missing options
    var isMissing = isMissingOption(this.options, ['projectId', 'version', 'apiKey', 'referenceLng']);
    if (isMissing) return callback(new Error(isMissing));

    this.submitting = this.pending;
    this.pending = {};

    var namespaces = Object.keys(this.submitting);

    var todo = namespaces.length;
    var doneOne = function doneOne() {
      todo--;

      if (!todo) {
        _this3.submitting = null;
      }
    };
    namespaces.forEach(function (ns) {
      var keys = Object.keys(_this3.submitting[ns]);
      var url = replaceIn(_this3.options.lastUsedPath, ['projectId', 'version', 'lng', 'ns'], _extends({}, _this3.options, { lng: _this3.options.referenceLng, ns: ns }));

      if (keys.length) {
        ajax(url, _extends({ authorize: true }, _this3.options), function (data, xhr) {
          doneOne();
        }, keys);
      } else {
        doneOne();
      }
    });
  }
};

locizeLastUsed.type = '3rdParty';

return locizeLastUsed;

})));
