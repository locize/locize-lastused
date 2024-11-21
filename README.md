[![Actions](https://github.com/locize/locize-lastused/workflows/node/badge.svg)](https://github.com/locize/locize-lastused/actions?query=workflow%3Anode)
[![npm version](https://img.shields.io/npm/v/locize-lastused.svg?style=flat-square)](https://www.npmjs.com/package/locize-lastused)

This is an i18next plugin or standalone script to be used for [locize](http://locize.com) service. It will update last used timestamps on reference keys (so only on your reference/source language) from your locize project using http requests.

# Troubleshooting

**Seems not working**

Per default only `localhost` is allowed to send last used information (to avoid using this feature accidentally in production). If you're not using `localhost` during development you will have to set the `allowedHosts: ['your.domain.tld']` for the options.

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/locize-lastused) or [downloaded](https://cdn.rawgit.com/locize/locize-lastused/master/locizeLastUsed.min.js) from this repo.

```bash
# npm package
$ npm install locize-lastused
```

## Options

**IMPORTANT** make sure you do not add your apiKey in the production build to avoid misuse by strangers

```js
{
  // the id of your locize project
  projectId: '[PROJECTID]',

  // add an api key if you want to send missing keys
  apiKey: '[APIKEY]',

  // the reference language of your project
  referenceLng: '[LNG]',

  // version - defaults to latest
  version: '[VERSION]',

  // debounce interval to send data in milliseconds
  debounceSubmit: 90000,

  // hostnames that are allowed to send last used data
  // please keep those to your local system, staging, test servers (not production)
  allowedHosts: ['localhost']
}
```

## Using with i18next

Options can be passed in by setting options.locizeLastUsed in i18next.init:

```js
import i18next from 'i18next';
import locizeLastUsed from 'locize-lastused';
// or
const i18next = require('i18next');
const locizeLastUsed = require('locize-lastused');

i18next.use(locizeLastUsed).init({
  locizeLastUsed: options
});
```

- If you don't use a module loader it will be added to `window.locizeLastUsed`

## Using without i18next

Directly call locizeLastUsed.init:

```js
import locizeLastUsed from 'locize-lastused';

locizeLastUsed.init(options);
```

then call used function with namespace and key:

```js
import locizeLastUsed from 'locize-lastused';

locizeLastUsed.used('myNamespace', 'myKey.as.in.locize');
```

## TypeScript

To properly type the options, you can import the `LocizeLastusedOptions` interface and use it as a generic type parameter to the i18next's `init` method, e.g.:

```ts
import i18n from 'i18next'
import LocizeLastusedPlugin, { LocizeLastusedOptions } from 'locize-lastused'

i18n
  .use(LocizeLastusedPlugin)
  .init<LocizeLastusedOptions>({
    locizeLastUsed: {
      // locize lastused options
      projectId: '1234123424234',
      apiKey: 'my-api-key'
    },

    // other i18next options
  })
```