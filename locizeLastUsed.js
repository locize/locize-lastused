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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    window.console && console.log(e);
  }
}

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

var LocizeLastUsed = function () {
  function LocizeLastUsed() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, LocizeLastUsed);

    this.init(options);

    this.type = '3rdParty';
  }

  _createClass(LocizeLastUsed, [{
    key: 'init',
    value: function init(options) {
      var isI18next = options.t && typeof options.t === 'function';

      this.options = isI18next ? _extends({}, getDefaults(), this.options, options.options.locizeLastUsed) : _extends({}, getDefaults(), this.options, options);

      this.submitting = null;
      this.pending = {};
      this.done = {};

      this.submit = debounce(this.submit, this.options.debounceSubmit);

      // intercept
      if (isI18next) this.interceptI18next(i18next);
    }
  }, {
    key: 'interceptI18next',
    value: function interceptI18next(i18next) {
      var _this = this;

      var origGetResource = i18next.services.resourceStore.getResource;

      i18next.services.resourceStore.getResource = function (lng, ns, key, options) {
        // call last used
        _this.used(ns, key);

        // by pass orginal call
        return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options);
      };
    }
  }, {
    key: 'used',
    value: function used(ns, key) {
      var _this2 = this;

      ['pending', 'done'].forEach(function (k) {
        if (_this2.done[ns] && _this2.done[ns][key]) return;
        if (!_this2[k][ns]) _this2[k][ns] = {};
        _this2[k][ns][key] = true;
      });

      this.submit();
    }
  }, {
    key: 'submit',
    value: function submit() {
      var _this3 = this;

      if (this.submitting) return this.submit();
      this.submitting = this.pending;
      this.pending = {};

      var url = replaceIn(this.options.lastUsedPath, _extends({}, this.options, { lng: this.options.referenceLng }));

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

        if (keys.length) {
          ajax(url, _extends({ authorize: true }, _this3.options), function (data, xhr) {
            doneOne();
          }, keys);
        } else {
          doneOne();
        }
      });
    }
  }]);

  return LocizeLastUsed;
}();

LocizeLastUsed.type = '3rdParty';

return LocizeLastUsed;

})));
