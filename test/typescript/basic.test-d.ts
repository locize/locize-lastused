import i18next from 'i18next';
import Plugin, { LocizeLastusedOptions } from 'locize-lastused';

i18next.use(Plugin).init<LocizeLastusedOptions>({
  locizeLastUsed: {
    projectId: '1234123424234',
    apiKey: 'my-api-key'
  },
});
