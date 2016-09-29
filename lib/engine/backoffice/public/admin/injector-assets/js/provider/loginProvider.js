(function () {
    'use strict';
    angular.module('injectorApp')
        .provider('loginProvider', function () {

            this.$get = function ($http, $location, cookieStore, $rootScope) {
                var factory = {};
                $http.defaults.headers.common['Client-Type'] = 'backoffice';
                $http.defaults.headers.common.profile = 'back';
                factory.login = function (userModel, cb) {
                    $http.post('/auth/login', userModel).success(function (res) {
                        var user = {};
                        //user.name = userModel.login;
                        user.login = userModel.login;
                        user.role = res.role;
                        user.token = res.token;
                        var cookieOptions = {path: '/', end: Infinity};
                        cookieStore.put('user', JSON.stringify(user), cookieOptions);
                        $http.defaults.headers.common.Authorization = 'BEARER ' + res.token;
                        $rootScope.$broadcast('login', user);
                        $rootScope.allowedUser = true;
                        cb(user);
                    }).error(function (err) {
                        var cookieOptions = {path: '/'};
                        cookieStore.remove('user', cookieOptions);
                        $rootScope.$broadcast('logout', undefined);
                        $rootScope.allowedUser = false;
                        cb(false);
                    });
                };

                factory.getUser = function (cb) {
                    var user = JSON.parse(cookieStore.get('user'));
                    if (user && !$rootScope.allowedUser && user.login && (user.password || user.token)) {
                        factory.login(user, function (logged) {
                            if (logged) {
                                angular.extend(user, logged);
                                cb(logged);
                            } else {
                                cb(undefined);
                            }
                        });
                    } else {
                        if (!user) {
                            $rootScope.allowedUser = false;
                        } else {
                            //$rootScope.$broadcast('login', user);
                        }

                        cb(user);
                    }
                };

                factory.logout = function () {
                    var cookieOptions = {path: '/'};
                    cookieStore.remove('user', cookieOptions);
                    $location.path('/login');
                    $rootScope.$broadcast('logout', undefined);
                };

                return factory;
            };
        });
}());
