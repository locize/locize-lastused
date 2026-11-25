### 5.2.0

- fix: after one send with nothing new in it, lastused never sent again on that page. A lookup of a key it had already sent still started a send; that send found nothing waiting, but marked itself as running and never finished, so every later send waited for it forever. In a single-page app this meant: the keys of the first view were sent, those of every view after it never were.
- fix: a page that kept translating (a re-render, a clock, polling) never sent anything: every lookup, also of a key already sent, restarted the 90 second wait. Now the first new key starts the wait (`debounceSubmit`) and later keys do not restart it, so whatever is waiting goes out once per interval, also while new keys keep coming.
- feat: a key looked up again a little over 12 hours after it was sent is sent again (`resubmitAfter`, in milliseconds, default 12 hours and 5 minutes; the API keeps a newer last use only once the stored one is more than 12 hours old). Before, each key was sent once per page or process, so on a staging server running for weeks the last use of its keys stopped at the day it started, and keys still in use looked unused.
- feat: in a browser, what is waiting is sent when the page is closed or hidden, also while another send is still running, with `keepalive` so the request can outlive the page (up to the browser's 64 KiB for such requests; a larger body is sent without it and is usually cancelled when the page goes). A visit shorter than the interval sent nothing before.
- fix: the keys of a send that got no answer, a 429 or a 5xx were dropped; they now get one more try with the next send. A 401 or 403 still stops lastused for the page. Under XMLHttpRequest, no answer at all counted as success, and an exception while sending left the send running forever.
- fix: only the callback of the last `used()` before a send was called; now each one is, once, and after the request has ended, so a callback that throws no longer ends a send twice. A new `init()` calls the callbacks still waiting with an error instead of dropping them, and a send still running for the earlier settings changes nothing of the new ones.
- fix: a namespace or key named `__proto__` (reachable through `t('__proto__:x')`) wrote onto the prototype of every object.
- fix: on a host that is not allowed, `used()` no longer queues keys it will never send, and its callback gets the error at once.
- fix: every `init()` wrapped the send in one more debounce.
- chore: tests and type tests run against i18next 27.2.9; CI uses actions/checkout and actions/setup-node v7.

### 5.1.0

- types: the plugin now declares its own `locizeLastUsed` init option (it augments i18next's `CustomPluginOptions`), so `i18next.init({ locizeLastUsed: { ... } })` keeps type-checking when i18next 27 stops declaring that option in core. With i18next 26 core's own declaration still applies.
- types: `LocizeLastusedOptions` now matches what the plugin reads: `apiKey` is optional (it falls back to `backend.apiKey`), `debounceSubmit` is added, and `allowedHosts` is a `readonly string[]` (a function was never supported at runtime).
- chore: devDependencies updated (i18next 26.7.1, eslint 10, mocha 12, neostandard 0.14, tsd 0.33, tsdown 0.23, TypeScript 7); CI now tests on Node 22, 24 and 26, since the build tooling needs Node 22 or newer. The published code still runs on Node 18 or newer.

### 5.0.1

- a key the locize API refuses (401: no write access, e.g. a `readonly` key; 403: a plan limit) is refused again on every later submit, so after the first refusal lastused warns once in the console and stops sending for the page.

### 5.0.0

- BREAKING: drop `cross-fetch` dependency. `locize-lastused` now requires a host-provided `fetch`. This is available in Node ≥ 18 (stable since Node 21), all modern browsers, Deno, and Bun. For runtimes without native `fetch`, install a ponyfill yourself before loading this module, or stay on v4.x.
- BREAKING: minimum Node version is now 18 (`engines.node = ">=18"`).
- chore: simplified environment detection in `lib/request.js` — uses `globalThis` (with `global` / `window` fallbacks for legacy embedded runtimes) instead of separate `global.*` / `window.*` branches per API. XHR / ActiveXObject are still picked up if the host provides them, but no longer polyfilled.
- chore: declared `"sideEffects": false` for better tree-shaking by downstream bundlers.
- build: replaced babel + browserify + uglify-js with [`tsdown`](https://tsdown.dev) (rolldown + oxc). One config produces ESM, CJS, and the IIFE browser bundles. Drops `@babel/cli`, `@babel/core`, `@babel/preset-env`, `babel-plugin-add-module-exports`, `browserify`, `uglify-js`, the `fixcjs` rewrite hack, and the `--ignore cross-fetch` browserify flag. Side benefit: minified browser bundle shrinks from ~9 KB to ~4.8 KB.
- build: ESM and CJS outputs are now bundled into a single `index.js` per format (previously one file per `lib/*.js` module). The package's `exports` map is unchanged, so this is invisible to consumers using documented entry points.
- lint: replaced `eslint-config-standard` (+ five plugins) with [`neostandard`](https://github.com/neostandard/neostandard) and migrated to ESLint 9 flat config (`eslint.config.mjs`). Removed deprecated `tslint` and `dtslint` — `test:typescript` now runs `tsc --noEmit` plus `tsd`.
- docs: bumped CDN download link in README from the dead `cdn.rawgit.com` (shut down in 2019) to a current `cdn.jsdelivr.net` URL pinned to `@5`. Added v5 migration callout.

### 4.0.2

- optimize fetchApi selector

### 4.0.1

- try to get rid of top-level await

### 4.0.0

- fix for Deno 2 and removal of unnecessary .cjs file
- for esm build environments not supporting top-level await, you should import the `locize-lastused/cjs` export or stay at v3.4.1

### 3.4.3

- optimize fetchApi selector [backported]

### 3.4.1

- fix: remove typeof window.document === 'undefined' check which deopt bundle optimization

### 3.4.0

- fix: separate cjs and mjs typings

### 3.3.2

- fix for browser usage

### 3.3.0

- update deps

### 3.2.2

- hack for debug mode in react-native

### 3.2.1

- fix for types moduleResolution "node16"

### 3.2.0

- add type definitions

### 3.1.1

- error if no fetch and no xhr implementation found

### 3.1.0

- if options not passed, try to use the one of i18next-locize-backend

### 3.0.13

- update dependencies

### 3.0.12

- replace internal node-fetch with cross-fetch

### 3.0.11

- XMLHttpRequest fix for ios < 9

### 3.0.10

- update dependencies

### 3.0.9

- transpile also esm

### 3.0.8

- fix xhr response handling

### 3.0.7

- do not try to load node-fetch in browser

### 3.0.6

- fix for non-fetch browsers using locizeLastUsed.js

### 3.0.5

- replace spread operator with defaults function

### 3.0.4

- fix exports for react-native

### 3.0.3

- dedicated export for node v14

### 3.0.2

- fix for react-native

### 3.0.1

- fix for bundlers like rollup

### 3.0.0

- complete refactoring to make this module universal (replaces locize-node-lastused)

### 2.0.0

- using the new `locize.app` domain replacing the deprecated `locize.io` domain
- updated dev dependencies
- update build process
- remove bower stuff

### 1.1.1

- warn for missing options

### v1.1.0

- allow to define a list of allowed hosts to send lastUsed data - defaults to localhost

### v1.0.1

- initial version
