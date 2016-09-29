(function () {
    'use strict';

    angular.module('injectorApp')
        .config(function ($routeProvider, configs, extensions, customMenuProvider) {

            var authCheck = function ($q, $rootScope, $location, $http, loginProvider, configs) {
                var defer = $q.defer();
                if (configs.auth) {
                    loginProvider.getUser(function (user) {
                        if (!user) {
                            $location.path('/login');
                        } else {
                            $http.defaults.headers.common.Authorization = 'BEARER ' + user.token;
                            $rootScope.login = undefined;
                        }
                        defer.resolve();
                    });

                } else {
                    $rootScope.allowedUser = true;
                    defer.resolve();
                }
                return defer.promise;
            };

            var homePage = 'dist/html/models.html';
            if (configs.backoffice.home) {
                homePage = configs.backoffice.home;
            }

            $routeProvider
                .when('/', {
                    templateUrl: homePage,
                    controller: 'MainController',
                    resolve: {
                        app: authCheck
                    }
                })
                .when('/model/:schema', {
                    templateUrl: 'dist/html/model.html',
                    controller: 'ModelController',
                    resolve: {
                        app: authCheck
                    }
                })
                .when('/model/:schema/new', {
                    templateUrl: 'dist/html/create-and-update.html',
                    controller: 'CreateController',
                    resolve: {
                        app: authCheck
                    },
                    reloadOnSearch: false
                })
                .when('/model/:schema/update/:id', {
                    templateUrl: 'dist/html/create-and-update.html',
                    controller: 'UpdateController',
                    resolve: {
                        app: authCheck
                    },
                    reloadOnSearch: false
                })
                .when('/model/:schema/update/:id/:shard', {
                    templateUrl: 'dist/html/create-and-update.html',
                    controller: 'UpdateController',
                    resolve: {
                        app: authCheck
                    },
                    reloadOnSearch: false
                })
                .when('/model/:schema/graphs', {
                    templateUrl: 'dist/html/graphs.html',
                    controller: 'GraphsController',
                    resolve: {
                        app: authCheck
                    }
                })
                .when('/login', {
                    // login / password
                    templateUrl: 'dist/html/login.html',
                    controller: 'LoginController',
                    resolve: {
                        app: function ($q, $rootScope, $location, loginProvider) {
                            var defer = $q.defer();
                            loginProvider.getUser(function (user) {
                                if (user) {
                                    $location.path('/');
                                } else {
                                    $rootScope.login = true;
                                }
                                defer.resolve();
                            });
                            return defer.promise;
                        }
                    }
                })
                .when('/logout', {
                    resolve: {
                        app: function ($q, $rootScope, $location, loginProvider) {
                            var defer = $q.defer();
                            loginProvider.logout();
                            $location.path('/');
                            defer.resolve();
                            return defer.promise;
                        }
                    }
                }).when('/settings', {
                    templateUrl: 'dist/html/settings.html',
                    controller: 'SettingsController'
                });


            if (extensions && extensions.pages) {
                var menu = [];
                for (var i in extensions.pages) {
                    var page = extensions.pages[i];

                    if (page.backoffice) {

                        console.log(page);

                        $routeProvider.when('/' + page.url, {
                            templateUrl: page.template,
                            controller: page.controller,
                            resolve: {
                                app: authCheck
                            }
                        });
                    }

                    if (page.menu) {
                        menu.push(page.menu);
                    }
                }
                customMenuProvider.setCustomMenu(menu);
            }

            $routeProvider.otherwise({redirectTo: '/'});
        });
}());