import i18next, { PluginOptions } from 'i18next';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import Plugin, { LocizeLastusedOptions } from 'locize-lastused';

// i18next 26 still declares `locizeLastUsed` on InitOptions itself: the package's declaration must not clash with it
i18next.use(Plugin).init({
  locizeLastUsed: { projectId: '123', apiKey: 'key', debounceSubmit: 1000, allowedHosts: ['localhost'] },
});

// i18next 27 leaves the option to the plugin: InitOptions gets it from CustomPluginOptions through PluginOptions
expectType<LocizeLastusedOptions | undefined>(({} as PluginOptions<object>).locizeLastUsed);
expectAssignable<PluginOptions<object>>({
  locizeLastUsed: { projectId: '123', lastUsedPath: 'http://localhost/{{projectId}}', crossDomain: false },
});
expectNotAssignable<PluginOptions<object>>({ locizeLastUsed: { apiKey: 'key' } });
