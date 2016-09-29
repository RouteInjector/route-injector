(function () {
    'use strict';
    angular.module('injectorApp').directive('ellipsis', function () {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs, ngModel) {
                var width = element.width();
                element.css("width", width);
                element.css("text-overflow", 'ellipsis');
                element.css("overflow", 'hidden');
                element.css("white-space", 'nowrap');
                // Do calculation
                //var model = scope.$eval(attrs.ngModel);
                //console.log("Model", model);
                //console.log("Model > Length", model.width());
            }
        };
    });
}());