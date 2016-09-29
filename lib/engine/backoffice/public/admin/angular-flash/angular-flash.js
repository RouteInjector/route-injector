(function () {
    'use strict';
    angular.module('flash', [])
        .factory('flash', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
            var messages = [];

            var reset;
            var cleanup = function () {
                $timeout.cancel(reset);
                reset = $timeout(function () {
                    messages = [];
                });
            };

            var emit = function () {
                $rootScope.$emit('flashMessage', messages[0], cleanup);
            };

            $rootScope.$on('$locationChangeSuccess', emit);

            var factory = {};

            factory.error = function () {
                [].unshift.call(arguments, "error");
                process.apply(this, arguments);
            };
            factory.success = function () {
                [].unshift.call(arguments, "success");
                process.apply(this, arguments);
            };

            factory.warning = function () {
                [].unshift.call(arguments, "warning");
                process.apply(this, arguments);
            };

            factory.getMessage = function () {
                return messages[0];
            };

            function process() {
                var length = arguments.length;
                if (length < 3) {
                    throw new Error("Minimum arguments for Flash is 2 (Title and Body)");
                }

                var obj = {
                    type: arguments[0],
                    title: arguments[1]
                };
                if (length < 4) {
                    obj.message = arguments[2];
                } else {
                    obj.messages = [];
                    for (var i = 0; i < length - 2; i++) {
                        obj.messages.push(arguments[2 + i]);
                    }
                }
                emit(messages = [obj]);
            }

            return factory;
        }])

        .directive('flashMessage', [function () {
            return {
                restrict: 'E',
                template: '<div ng-if="type==\'error\'" class="alert alert-danger">' +
                '<span><h3>{{title}}</h3></span>' +
                '<p ng-if="message" ng-bind-html="message"></p>' +
                '<li ng-if="messages" ng-repeat="m in messages"><p ng-bind-html="m"></p></li>' +
                '</div>' +

                '<div ng-if="type==\'success\'" class="alert alert-success">' +
                '<span><h3>{{title}}</h3></span>' +
                '<p ng-if="message" ng-bind-html="message"></p>' +
                '<li ng-if="messages" ng-repeat="m in messages"><p ng-bind-html="m"></p></li>' +
                '</div>' +

                '<div ng-if="type==\'warning\'" class="alert alert-warning">' +
                '<span><h3>{{title}}</h3></span>' +
                '<p ng-if="message" ng-bind-html="message"></p>' +
                '<li ng-if="messages" ng-repeat="m in messages"><p ng-bind-html="m"></p></li>' +
                '</div>',
                controller: ['$scope', '$rootScope', 'flash', function ($scope, $rootScope, flash) {
                    $rootScope.$on('flashMessage', function (event, data, done) {
                        processData(data);
                        done();
                    });
                    $scope.getMessage = function () {

                        processData(flash.getMessage());
                    };
                    $scope.getMessage();

                    function processData(data) {
                        if (data) {
                            $scope.type = data.type;
                            $scope.title = data.title;
                            $scope.messages = data.messages;
                            $scope.message = data.message;
                            //done();
                        }
                    }
                }]
            };
        }]);
})();
