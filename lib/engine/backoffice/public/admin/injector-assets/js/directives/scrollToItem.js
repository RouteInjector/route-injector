(function () {
    'use strict';
    angular.module('injectorApp')
        .directive('scrollToItem', function () {
            return {
                restrict: 'A',
                scope: {
                    scrollTo: "@"
                },
                link: function (scope, $elm, attr) {

                    $elm.on('click', function () {
                        $('html,body').animate({scrollTop: $(scope.scrollTo).offset().top}, "slow");
                    });
                }
            };
        });
}());