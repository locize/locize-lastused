const i18next = require('i18next');
const LocizeBackend = require('i18next-locize-backend');
const LocizeLastUsed = require('../cjs/index.js')

const yourOptions = {
	debug: true,
  saveMissing: true,
  preload: ['en', 'de'],
  fallbackLng: 'en',
  backend: {
    // referenceLng: 'en',
    projectId: '3d0aa5aa-4660-4154-b6d9-907dbef10bb2',
    apiKey: '51837bfd-ed1f-4ed4-afb6-dd3049f6ee7f',
		// version: 'staging',
    // loadPath: 'https://api.locize.app/2596e805-2ce2-4e21-9481-ee62202ababd/{{version}}/{{lng}}/{{ns}}',
    // addPath: 'https://api.locize.app/missing/2596e805-2ce2-4e21-9481-ee62202ababd/{{version}}/{{lng}}/{{ns}}'
  },
  locizeLastUsed: {
    // referenceLng: 'en',
    // projectId: '3d0aa5aa-4660-4154-b6d9-907dbef10bb2',
    // apiKey: '51837bfd-ed1f-4ed4-afb6-dd3049f6ee7f',
    debounceSubmit: 6000
  }
};

i18next.use(LocizeBackend);
i18next.use(LocizeLastUsed);
i18next.init(yourOptions);

setTimeout(() => {
  console.log(i18next.t('translation:key1', { lng: 'en' }))
  console.log(i18next.t('translation:key2', { lng: 'en' }))
}, 5000);
