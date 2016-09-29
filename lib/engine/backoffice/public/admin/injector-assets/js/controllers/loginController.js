(function () {
    'use strict';
    angular.module('injectorApp')
        .controller('LoginController', function ($http, $scope, $document, $location, loginProvider) {
        $scope.update = function (user) {
            loginProvider.login(user, function (res) {
                if (!res) {
                    $scope.loginError = 'Incorrect username of password';
                } else{
                    $location.path('/');
                }
            });
        };
    });
}());