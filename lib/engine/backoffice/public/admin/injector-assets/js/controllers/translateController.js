(function () {
    'use strict';

    angular.module('injectorApp')
        .controller('TranslateController', function ($scope, $translate, configs) {
            //$scope.languages = $translate.getAvailableLanguageKeys();
            $scope.languages = ['en', 'es'];
            if (configs.backoffice.uniqueLanguage) {
                $scope.showLanguages = false;
                $translate.use(configs.backoffice.uniqueLanguage);
            } else {
                $scope.showLanguages = true;
                $scope.use = function (lang) {
                    $translate.use(lang);
                };
            }
        });
}());