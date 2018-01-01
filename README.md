[![Travis](https://img.shields.io/travis/locize/locize-lastused/master.svg?style=flat-square)](https://travis-ci.org/locize/locize-lastused)
[![Coveralls](https://img.shields.io/coveralls/locize/locize-lastused/master.svg?style=flat-square)](https://coveralls.io/github/locize/locize-lastused)
[![npm version](https://img.shields.io/npm/v/locize-lastused.svg?style=flat-square)](https://www.npmjs.com/package/locize-lastused)
[![Bower](https://img.shields.io/bower/v/locize-lastused.svg)]()
[![David](https://img.shields.io/david/locize/locize-lastused.svg?style=flat-square)](https://david-dm.org/locize/locize-lastused)

This is an i18next plugin or standalone scriot to be used for [locize](http://locize.com) service. It will update last used timestamps on reference keys from your locize project using xhr.

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/locize-lastused) or [downloaded](https://cdn.rawgit.com/locize/locize-lastused/master/locize-lastusedd.min.js) from this repo.

```
# npm package
$ npm install locize-lastused
```

## Using with i18next

Wiring up:

```js
import i18next from 'i18next';
import LocizeLastUsed from 'locize-lastused';

i18next
  .use(LocizeLastUsed)
  .init(i18nextOptions);
```

- As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.
- If you don't use a module loader it will be added to `window.locizeLastUsed`


## Options

```js
{
  // the id of your locize project
  projectId: '[PROJECTID]',

  // add an api key if you want to send missing keys
  apiKey: '[APIKEY]',

  // the reference language of your project
  referenceLng: '[LNG]',

  // version - defaults to latest
  version: '[VERSION]'

  // debounce interval to send data in milliseconds
  debounceSubmit: 90000
}
```

Options can be passed in:

**preferred** - by setting options.locizeLastUsed in i18next.init:

```js
import i18next from 'i18next';
import LocizeLastUsed from 'locize-lastused';

i18next
  .use(LocizeLastUsed)
  .init({
    backend: options
  });
```

on construction:

```js
  import LocizeLastUsed from 'locize-lastused';
  const locize = new LocizeLastUsed(options);
```

via calling init:

```js
  import LocizeLastUsed from 'locize-lastused';
  const locize = new LocizeLastUsed();
  locize.init(null, options);
```
