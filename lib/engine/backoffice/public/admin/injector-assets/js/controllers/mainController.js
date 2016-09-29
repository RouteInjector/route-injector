(function () {
    'use strict';
    angular.module('injectorApp')

        .filter('encodeURIComponent', function() {
            return window.encodeURIComponent;
        })

        .controller('MainController', function ($rootScope, $scope, $q, loginProvider, models) {
            $scope.postLoginFuncs = [];
            //console.log($rootScope.$digestTtl);
            $scope.postLoginFuncs.push(function(){
                models.getModels(function (m) {
                    $scope.schemas = {};
                    angular.forEach(m, function (schema) {
                        models.getModelConfig(schema, function (config) {
                            $scope.schemas[schema] = config;
                            
                            loginProvider.getUser(function(){}); //Force first login
                            if (config.isSingle) {
                                models.getSingleModel(schema, function (doc) {
                                    if (!doc) {
                                        $scope.schemas[schema].redirectTo = "#/model/" + schema + "/new";
                                    } else {
                                        $scope.schemas[schema].redirectTo = "#/model/" + schema + "/update/" + doc[config.id];
                                    }
                                });
                            }
                        });
                    });
                });
            });


            $scope.schemaHREF = function (name, conf) {
                return conf.redirectTo || "#/model/" + name;
            };

            angular.element('body').ready(function () {
                $rootScope.$broadcast('bodyReady', 'MainController');
            });

            $rootScope.$on('login', function (event, args) {
                angular.forEach($scope.postLoginFuncs, function(v){
                    v();
                });
                $scope.postLoginFuncs = [];
            });

            $rootScope.$on('logout', function (event, args) {
            });
    });
}());


