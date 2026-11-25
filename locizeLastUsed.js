var locizeLastUsed = (function() {
	// lib/utils.js
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
	// lib/request.js
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
			headers,
			keepalive: !!options.keepalive
		}).then(resolver).catch(callback);
		else fetchApi(url, {
			method: payload ? "POST" : "GET",
			body: payload ? JSON.stringify(payload) : void 0,
			headers,
			keepalive: !!options.keepalive
		}).then(resolver).catch(callback);
	};
	const requestWithXmlHttpRequest = (options, url, payload, cb) => {
		let completed = false;
		const callback = (err, res) => {
			if (completed) return;
			completed = true;
			cb(err, res);
		};
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
			callback(e);
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
	// lib/index.js
	const getDefaults = () => {
		return {
			lastUsedPath: "https://api.locize.app/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}",
			referenceLng: "en",
			crossDomain: true,
			setContentTypeJSON: false,
			version: "latest",
			debounceSubmit: 9e4,
			resubmitAfter: 435e5,
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
			if (this.callbacks) this.callbacks.splice(0).forEach((callback) => callback(/* @__PURE__ */ new Error("locize-lastused: init() was called again before these keys were sent")));
			clearTimeout(this.timer);
			this.timer = null;
			this.sending = false;
			this.pending = Object.create(null);
			this.callbacks = [];
			this.sentAt = Object.create(null);
			if (typeof window !== "undefined" && typeof document !== "undefined" && window.addEventListener && !this.listening) {
				this.listening = true;
				const flush = () => this.send(true);
				window.addEventListener("pagehide", flush);
				document.addEventListener("visibilitychange", () => {
					if (document.visibilityState === "hidden") flush();
				});
			}
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
			if (!this.isAllowed) return callback && callback(/* @__PURE__ */ new Error("not allowed"));
			const now = Date.now();
			const sentAt = this.sentAt[ns] && this.sentAt[ns][key];
			if (sentAt && now - sentAt < this.options.resubmitAfter) return callback && callback();
			if (!this.sentAt[ns]) this.sentAt[ns] = Object.create(null);
			this.sentAt[ns][key] = now;
			this.queue(ns, [key], 1);
			if (callback) this.callbacks.push(callback);
			this.schedule();
		},
		queue(ns, keys, attempt) {
			if (!this.pending[ns]) this.pending[ns] = Object.create(null);
			keys.forEach((key) => {
				this.pending[ns][key] = attempt;
			});
		},
		schedule() {
			if (this.timer) return;
			this.timer = setTimeout(() => {
				this.timer = null;
				this.send();
			}, this.options.debounceSubmit);
		},
		send(keepalive) {
			const namespaces = Object.keys(this.pending);
			if (!namespaces.length) return;
			if (this.sending && !keepalive) return;
			const batch = this.pending;
			const callbacks = this.callbacks;
			const options = this.options;
			this.pending = Object.create(null);
			this.callbacks = [];
			const finish = (err) => callbacks.forEach((callback) => callback(err));
			if (!this.isAllowed) return finish(/* @__PURE__ */ new Error("not allowed"));
			const isMissing = isMissingOption(this.options, [
				"projectId",
				"version",
				"apiKey",
				"referenceLng"
			]);
			if (isMissing) return finish(new Error(isMissing));
			if (!keepalive) this.sending = true;
			let keepaliveBudget = keepalive ? 61440 : 0;
			let todo = namespaces.length;
			let lastError;
			const doneOne = (ns, keys) => (err, res) => {
				const status = res && res.status;
				const noAnswer = !status && (!!err || status === 0);
				const current = this.options === options;
				if (!current) {} else if ((status === 401 || status === 403) && this.isAllowed) {
					this.isAllowed = false;
					if (typeof console !== "undefined" && console.warn) console.warn(`locize-lastused: stopped sending last used information on this page, the locize API answered ${status} ${err || ""}. A 401 means the api key has no write access (it needs the role "user" or "admin"); lastused belongs on development or staging, never in production.`);
				} else if (noAnswer || status === 429 || status >= 500) {
					const again = keys.filter((key) => batch[ns][key] < 2);
					if (again.length) this.queue(ns, again, 2);
				}
				if (noAnswer || status >= 400) lastError = err || /* @__PURE__ */ new Error(`locize-lastused: the locize API answered ${status}`);
				todo--;
				if (todo) return;
				if (current && !keepalive) this.sending = false;
				if (current && Object.keys(this.pending).length) this.schedule();
				setTimeout(() => finish(lastError));
			};
			namespaces.forEach((ns) => {
				const keys = Object.keys(batch[ns]);
				const url = replaceIn(this.options.lastUsedPath, [
					"projectId",
					"version",
					"lng",
					"ns"
				], defaults({
					lng: this.options.referenceLng,
					ns
				}, this.options));
				const bytes = typeof TextEncoder === "function" ? new TextEncoder().encode(JSON.stringify(keys)).length : Infinity;
				const useKeepalive = bytes <= keepaliveBudget;
				if (useKeepalive) keepaliveBudget -= bytes;
				request(defaults({
					authorize: true,
					keepalive: useKeepalive
				}, this.options), url, keys, doneOne(ns, keys));
			});
		}
	};
	locizeLastUsed.type = "3rdParty";
	return locizeLastUsed;
})();
