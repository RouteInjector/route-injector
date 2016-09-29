(function () {
    'use strict';

    angular.module('injectorApp')
        .config(['$translateProvider', '$translatePartialLoaderProvider', function ($translateProvider, $translatePartialLoaderProvider, configs) {
            var i18n = configs.backoffice.i18n;
            $translatePartialLoaderProvider.addPart('login');
            $translatePartialLoaderProvider.addPart('model');
            $translatePartialLoaderProvider.addPart('models');
            $translatePartialLoaderProvider.addPart('navbar');
            $translatePartialLoaderProvider.addPart('search');
            $translatePartialLoaderProvider.addPart('create_update');
            //$translatePartialLoaderProvider.addPart('flash');
            $translatePartialLoaderProvider.addPart('version_dialog');

            if (i18n && i18n.length) {
                for (var i = 0; i < i18n.length; i++) {
                    $translatePartialLoaderProvider.addPart(i18n[i]);
                }
            }

            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: 'i18n/{part}/{lang}.json'
            });
            $translateProvider.registerAvailableLanguageKeys(['en', 'es']);
            var def = "en";
            $translateProvider.fallbackLanguage('en');
            $translateProvider.useLocalStorage();
            if (configs.backoffice.uniqueLanguage) {
                def = configs.backoffice.uniqueLanguage;
                $translateProvider.use(def);
            }
            $translateProvider.preferredLanguage(def);
        }]);

}());