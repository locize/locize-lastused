(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.locizeLastUsed = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
var fetchApi
if (typeof fetch === 'function') {
  if (typeof global !== 'undefined' && global.fetch) {
    fetchApi = global.fetch
  } else if (typeof window !== 'undefined' && window.fetch) {
    fetchApi = window.fetch
  }
}

if (typeof require !== 'undefined') {
  var f = fetchApi || require('node-fetch')
  if (f.default) f = f.default
  exports.default = f
  module.exports = exports.default
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"node-fetch":5}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _utils = require("./utils.js");

var _request = _interopRequireDefault(require("./request.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var getDefaults = function getDefaults() {
  return {
    lastUsedPath: 'https://api.locize.app/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
    referenceLng: 'en',
    crossDomain: true,
    setContentTypeJSON: false,
    version: 'latest',
    debounceSubmit: 90000,
    allowedHosts: ['localhost']
  };
};

var locizeLastUsed = {
  init: function init(options) {
    var isI18next = options.t && typeof options.t === 'function';
    this.options = isI18next ? (0, _utils.defaults)(options.options.locizeLastUsed, this.options || {}, getDefaults()) : (0, _utils.defaults)(options, this.options || {}, getDefaults());
    var hostname = typeof window !== 'undefined' && window.location && window.location.hostname;

    if (hostname) {
      this.isAllowed = this.options.allowedHosts.indexOf(hostname) > -1;
    } else {
      this.isAllowed = true;
    }

    this.submitting = null;
    this.pending = {};
    this.done = {};
    this.submit = (0, _utils.debounce)(this.submit, this.options.debounceSubmit); // intercept

    if (isI18next) this.interceptI18next(options);
  },
  interceptI18next: function interceptI18next(i18next) {
    var _this = this;

    var origGetResource = i18next.services.resourceStore.getResource;

    i18next.services.resourceStore.getResource = function (lng, ns, key, options) {
      // call last used
      if (key) _this.used(ns, key); // by pass orginal call

      return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options);
    };
  },
  used: function used(ns, key, callback) {
    var _this2 = this;

    ['pending', 'done'].forEach(function (k) {
      if (_this2.done[ns] && _this2.done[ns][key]) return;
      if (!_this2[k][ns]) _this2[k][ns] = {};
      _this2[k][ns][key] = true;
    });
    this.submit(callback);
  },
  submit: function submit(callback) {
    var _this3 = this;

    if (!this.isAllowed) return callback && callback(new Error('not allowed'));
    if (this.submitting) return this.submit(callback); // missing options

    var isMissing = (0, _utils.isMissingOption)(this.options, ['projectId', 'version', 'apiKey', 'referenceLng']);
    if (isMissing) return callback && callback(new Error(isMissing));
    this.submitting = this.pending;
    this.pending = {};
    var namespaces = Object.keys(this.submitting);
    var todo = namespaces.length;

    var doneOne = function doneOne(err) {
      todo--;

      if (!todo) {
        _this3.submitting = null;
        if (callback) callback(err);
      }
    };

    namespaces.forEach(function (ns) {
      var keys = Object.keys(_this3.submitting[ns]);
      var url = (0, _utils.replaceIn)(_this3.options.lastUsedPath, ['projectId', 'version', 'lng', 'ns'], (0, _utils.defaults)({
        lng: _this3.options.referenceLng,
        ns: ns
      }, _this3.options));

      if (keys.length) {
        (0, _request["default"])((0, _utils.defaults)({
          authorize: true
        }, _this3.options), url, keys, doneOne);
      } else {
        doneOne();
      }
    });
  }
};
locizeLastUsed.type = '3rdParty';
var _default = locizeLastUsed;
exports["default"] = _default;
module.exports = exports.default;
},{"./request.js":3,"./utils.js":4}],3:[function(require,module,exports){
(function (global){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var fetchNode = _interopRequireWildcard(require("./getFetch.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var fetchApi;

if (typeof fetch === 'function') {
  if (typeof global !== 'undefined' && global.fetch) {
    fetchApi = global.fetch;
  } else if (typeof window !== 'undefined' && window.fetch) {
    fetchApi = window.fetch;
  }
}

var XmlHttpRequestApi;

if (typeof XMLHttpRequest === 'function') {
  if (typeof global !== 'undefined' && global.XMLHttpRequest) {
    XmlHttpRequestApi = global.XMLHttpRequest;
  } else if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    XmlHttpRequestApi = window.XMLHttpRequest;
  }
}

var ActiveXObjectApi;

if (typeof ActiveXObject === 'function') {
  if (typeof global !== 'undefined' && global.ActiveXObject) {
    ActiveXObjectApi = global.ActiveXObject;
  } else if (typeof window !== 'undefined' && window.ActiveXObject) {
    ActiveXObjectApi = window.ActiveXObject;
  }
}

if (!fetchApi && fetchNode) fetchApi = fetchNode["default"] || fetchNode; // because of strange export

if (typeof fetchApi !== 'function') fetchApi = undefined; // fetch api stuff

var requestWithFetch = function requestWithFetch(options, url, payload, callback) {
  fetchApi(url, {
    method: payload ? 'POST' : 'GET',
    body: payload ? JSON.stringify(payload) : undefined,
    headers: {
      Authorization: options.authorize && options.apiKey ? options.apiKey : undefined,
      'Content-Type': 'application/json'
    }
  }).then(function (response) {
    var resourceNotExisting = response.headers && response.headers.get('x-cache') === 'Error from cloudfront';
    if (!response.ok) return callback(response.statusText || 'Error', {
      status: response.status,
      resourceNotExisting: resourceNotExisting
    });
    response.text().then(function (data) {
      callback(null, {
        status: response.status,
        data: data,
        resourceNotExisting: resourceNotExisting
      });
    })["catch"](callback);
  })["catch"](callback);
}; // xml http request stuff


var requestWithXmlHttpRequest = function requestWithXmlHttpRequest(options, url, payload, callback) {
  try {
    var x;

    if (XmlHttpRequestApi) {
      x = new XmlHttpRequestApi();
    } else {
      x = new ActiveXObjectApi('MSXML2.XMLHTTP.3.0');
    }

    x.open(payload ? 'POST' : 'GET', url, 1);

    if (!options.crossDomain) {
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    if (options.authorize && options.apiKey) {
      x.setRequestHeader('Authorization', options.apiKey);
    }

    if (payload || options.setContentTypeJSON) {
      x.setRequestHeader('Content-Type', 'application/json');
    }

    x.onreadystatechange = function () {
      var resourceNotExisting = x.getResponseHeader('x-cache') === 'Error from cloudfront';
      x.readyState > 3 && callback(x.statusText, {
        status: x.status,
        data: x.responseText,
        resourceNotExisting: resourceNotExisting
      });
    };

    x.send(JSON.stringify(payload));
  } catch (e) {
    console && console.log(e);
  }
};

var request = function request(options, url, payload, callback) {
  if (typeof payload === 'function') {
    callback = payload;
    payload = undefined;
  }

  callback = callback || function () {};

  if (fetchApi) {
    // use fetch api
    return requestWithFetch(options, url, payload, callback);
  }

  if (typeof XMLHttpRequest === 'function' || typeof ActiveXObject === 'function') {
    // use xml http request
    return requestWithXmlHttpRequest(options, url, payload, callback);
  } // import('node-fetch').then((fetch) => {
  //   fetchApi = fetch.default || fetch // because of strange export of node-fetch
  //   requestWithFetch(options, url, payload, callback)
  // }).catch(callback)

};

var _default = request;
exports["default"] = _default;
module.exports = exports.default;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./getFetch.js":1}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaults = defaults;
exports.debounce = debounce;
exports.isMissingOption = isMissingOption;
exports.replaceIn = replaceIn;
var arr = [];
var each = arr.forEach;
var slice = arr.slice;

function defaults(obj) {
  each.call(slice.call(arguments, 1), function (source) {
    if (source) {
      for (var prop in source) {
        if (obj[prop] === undefined) obj[prop] = source[prop];
      }
    }
  });
  return obj;
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this;
    var args = arguments;

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

function isMissingOption(obj, props) {
  return props.reduce(function (mem, p) {
    if (mem) return mem;

    if (!obj || !obj[p] || typeof obj[p] !== 'string' || !obj[p].toLowerCase() === p.toLowerCase()) {
      var err = "i18next-lastused :: got \"".concat(obj[p], "\" in options for ").concat(p, " which is invalid.");
      console.warn(err);
      return err;
    }

    return false;
  }, false);
}

function replaceIn(str, arr, options) {
  var ret = str;
  arr.forEach(function (s) {
    var regexp = new RegExp("{{".concat(s, "}}"), 'g');
    ret = ret.replace(regexp, options[s]);
  });
  return ret;
}
},{}],5:[function(require,module,exports){

},{}]},{},[2])(2)
});
