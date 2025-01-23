### 4.0.2

- optimize fetchApi selector

### 4.0.1

- try to get rid of top-level await

### 4.0.0

- fix for Deno 2 and removal of unnecessary .cjs file
- for esm build environments not supporting top-level await, you should import the `locize-lastused/cjs` export or stay at v3.4.1

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
