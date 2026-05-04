var locizeLastUsed = (function() {
	//#region lib/utils.js
	const arr = [];
	const each = arr.forEach;
	const slice = arr.slice;
	function defaults(obj) {
		each.call(slice.call(arguments, 1), (source) => {
			if (source) {
				for (const prop in source) if (obj[prop] === void 0) obj[prop] = source[prop];
			}
		});
		return obj;
	}
	function debounce(func, wait, immediate) {
		let timeout;
		return function() {
			const context = this;
			const args = arguments;
			const later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}
	function isMissingOption(obj, props) {
		return props.reduce((mem, p) => {
			if (mem) return mem;
			if (!obj || !obj[p] || typeof obj[p] !== "string" || !obj[p].toLowerCase() === p.toLowerCase()) {
				const err = `i18next-lastused :: got "${obj[p]}" in options for ${p} which is invalid.`;
				console.warn(err);
				return err;
			}
			return false;
		}, false);
	}
	function replaceIn(str, arr, options) {
		let ret = str;
		arr.forEach((s) => {
			const regexp = new RegExp(`{{${s}}}`, "g");
			ret = ret.replace(regexp, options[s]);
		});
		return ret;
	}
	//#endregion
	//#region lib/request.js
	const g = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : void 0;
	let fetchApi;
	if (typeof fetch === "function") fetchApi = fetch;
	else if (g && typeof g.fetch === "function") fetchApi = g.fetch;
	const XmlHttpRequestApi = (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object") && g ? g.XMLHttpRequest : void 0;
	const ActiveXObjectApi = typeof ActiveXObject === "function" && g ? g.ActiveXObject : void 0;
	const requestWithFetch = (options, url, payload, callback) => {
		const resolver = (response) => {
			const resourceNotExisting = response.headers && response.headers.get("x-cache") === "Error from cloudfront";
			if (!response.ok) return callback(response.statusText || "Error", {
				status: response.status,
				resourceNotExisting
			});
			response.text().then((data) => {
				callback(null, {
					status: response.status,
					data,
					resourceNotExisting
				});
			}).catch(callback);
		};
		const headers = {
			Authorization: options.authorize && options.apiKey ? options.apiKey : void 0,
			"Content-Type": "application/json"
		};
		if (typeof window === "undefined" && typeof global !== "undefined" && typeof global.process !== "undefined" && global.process.versions && global.process.versions.node) headers["User-Agent"] = `locize-lastused (node/${global.process.version}; ${global.process.platform} ${global.process.arch})`;
		if (typeof fetch === "function") fetch(url, {
			method: payload ? "POST" : "GET",
			body: payload ? JSON.stringify(payload) : void 0,
			headers
		}).then(resolver).catch(callback);
		else fetchApi(url, {
			method: payload ? "POST" : "GET",
			body: payload ? JSON.stringify(payload) : void 0,
			headers
		}).then(resolver).catch(callback);
	};
	const requestWithXmlHttpRequest = (options, url, payload, callback) => {
		try {
			const x = XmlHttpRequestApi ? new XmlHttpRequestApi() : new ActiveXObjectApi("MSXML2.XMLHTTP.3.0");
			x.open(payload ? "POST" : "GET", url, 1);
			if (!options.crossDomain) x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			if (options.authorize && options.apiKey) x.setRequestHeader("Authorization", options.apiKey);
			if (payload || options.setContentTypeJSON) x.setRequestHeader("Content-Type", "application/json");
			x.onreadystatechange = () => {
				const resourceNotExisting = x.getResponseHeader("x-cache") === "Error from cloudfront";
				x.readyState > 3 && callback(x.status >= 400 ? x.statusText : null, {
					status: x.status,
					data: x.responseText,
					resourceNotExisting
				});
			};
			x.send(JSON.stringify(payload));
		} catch (e) {
			console && console.log(e);
		}
	};
	const request = (options, url, payload, callback) => {
		if (typeof payload === "function") {
			callback = payload;
			payload = void 0;
		}
		callback = callback || (() => {});
		if (fetchApi) return requestWithFetch(options, url, payload, callback);
		if (XmlHttpRequestApi || ActiveXObjectApi) return requestWithXmlHttpRequest(options, url, payload, callback);
		callback(/* @__PURE__ */ new Error("No fetch and no xhr implementation found!"));
	};
	//#endregion
	//#region lib/index.js
	const getDefaults = () => {
		return {
			lastUsedPath: "https://api.locize.app/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}",
			referenceLng: "en",
			crossDomain: true,
			setContentTypeJSON: false,
			version: "latest",
			debounceSubmit: 9e4,
			allowedHosts: ["localhost"]
		};
	};
	const locizeLastUsed = {
		init(options) {
			const isI18next = options.t && typeof options.t === "function";
			if (isI18next && !options.options.locizeLastUsed.projectId && options.options.backend.projectId) options.options.locizeLastUsed.projectId = options.options.backend.projectId;
			if (isI18next && !options.options.locizeLastUsed.version && options.options.backend.version) options.options.locizeLastUsed.version = options.options.backend.version;
			if (isI18next && !options.options.locizeLastUsed.apiKey && options.options.backend.apiKey) options.options.locizeLastUsed.apiKey = options.options.backend.apiKey;
			if (isI18next && !options.options.locizeLastUsed.referenceLng && options.options.backend.referenceLng) options.options.locizeLastUsed.referenceLng = options.options.backend.referenceLng;
			if (isI18next && !options.options.locizeLastUsed.referenceLng && options.options.fallbackLng && Array.isArray(options.options.fallbackLng) && options.options.fallbackLng[0] !== "dev") options.options.locizeLastUsed.referenceLng = options.options.fallbackLng[0];
			this.options = isI18next ? defaults(options.options.locizeLastUsed, this.options || {}, getDefaults()) : defaults(options, this.options || {}, getDefaults());
			const hostname = typeof window !== "undefined" && window.location && window.location.hostname;
			if (hostname) this.isAllowed = this.options.allowedHosts.indexOf(hostname) > -1;
			else this.isAllowed = true;
			this.submitting = null;
			this.pending = {};
			this.done = {};
			this.submit = debounce(this.submit, this.options.debounceSubmit);
			if (isI18next) this.interceptI18next(options);
		},
		interceptI18next(i18next) {
			const origGetResource = i18next.services.resourceStore.getResource;
			i18next.services.resourceStore.getResource = (lng, ns, key, options) => {
				if (key) this.used(ns, key);
				return origGetResource.call(i18next.services.resourceStore, lng, ns, key, options);
			};
		},
		used(ns, key, callback) {
			["pending", "done"].forEach((k) => {
				if (this.done[ns] && this.done[ns][key]) return;
				if (!this[k][ns]) this[k][ns] = {};
				this[k][ns][key] = true;
			});
			this.submit(callback);
		},
		submit(callback) {
			if (!this.isAllowed) return callback && callback(/* @__PURE__ */ new Error("not allowed"));
			if (this.submitting) return this.submit(callback);
			const isMissing = isMissingOption(this.options, [
				"projectId",
				"version",
				"apiKey",
				"referenceLng"
			]);
			if (isMissing) return callback && callback(new Error(isMissing));
			this.submitting = this.pending;
			this.pending = {};
			const namespaces = Object.keys(this.submitting);
			let todo = namespaces.length;
			const doneOne = (err) => {
				todo--;
				if (!todo) {
					this.submitting = null;
					if (callback) callback(err);
				}
			};
			namespaces.forEach((ns) => {
				const keys = Object.keys(this.submitting[ns]);
				const url = replaceIn(this.options.lastUsedPath, [
					"projectId",
					"version",
					"lng",
					"ns"
				], defaults({
					lng: this.options.referenceLng,
					ns
				}, this.options));
				if (keys.length) request(defaults({ authorize: true }, this.options), url, keys, doneOne);
				else doneOne();
			});
		}
	};
	locizeLastUsed.type = "3rdParty";
	//#endregion
	return locizeLastUsed;
})();
