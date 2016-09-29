//(function () {
//    'use strict';
//    angular.module('injectorApp')
//        .provider('configs', function () {
//        var overrides = {};
//
//
//        this.override = function (_method, _function) {
//            overrides[_method] = _function;
//        };
//
//        this.$get = function ($rootScope, $http) {
//            var service = {};
//            var configs = {};
//
//            $rootScope.$on('logout', function(){
//                    configs = {};
//            });
//
//            service.getRoutesConfig = function (cb) {
//                service.getConfig('routes', cb);
//            };
//
//            service.getEnvConfig = function (cb) {
//                service.getConfig('env', cb);
//            };
//
//            service.getConfig = function (config, cb){
//                if(configs[config]){
//                    cb(configs[config]);
//                } else{
//                    $http.get('/config/' + config).then(function (jsonCfg) {
//                        configs[config] = jsonCfg.data;
//                        cb(configs[config]);
//                    });
//                }
//            };
//
//            angular.forEach(Object.keys(overrides), function (key) {
//                service[key] = overrides[key];
//            });
//
//            return service;
//        };
//    });
//}());