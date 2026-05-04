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
