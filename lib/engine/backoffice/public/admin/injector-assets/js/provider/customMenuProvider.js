(function () {
    'use strict';
    angular.module('injectorApp')
        .provider('customMenu', function () {
        var menuElements;

        this.setCustomMenu = function(value) {
            menuElements = value;
        };

        this.$get = function(){
            return menuElements;
        };
    });
}());