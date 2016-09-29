(function () {
    'use strict';

    angular.module('injectorApp')
        .controller('NavbarController', function ($scope, $location, loginProvider) {
            var navbar = function () {
                loginProvider.getUser(function (user) {
                    $scope.user = user;
                });
            };
            navbar();
            $scope.$on('login', function (event, data) {
                navbar();
            });

            $scope.logout = function () {
                loginProvider.logout();
                $location.path('/logout');
            };
        });
}());