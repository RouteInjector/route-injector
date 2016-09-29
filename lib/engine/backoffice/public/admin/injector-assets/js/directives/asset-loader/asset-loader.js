(function () {
    'use strict';
    angular.module('injectorApp').directive('assetLoader', ['configs', function (extensions) {
        return {
            restrict: 'E',
            scope: {
                src: '@',
                type: '@'
            },
            link: function (scope, element, attrs, ngModel) {

                var html = "";
                if (scope.src == 'custom') {

                    html += generateHTML(extensions.files[scope.type], scope.type);
                } else if (scope.src == 'pages') {
                    for (var i in extensions.pages) {
                        var p = extensions.pages[i];
                        if (p.backoffice) {
                            html += generateHTML(p[scope.type], scope.type);
                        }
                    }
                }
                element.append(html);
            }
        };
    }]);

    function generateHTML(obj, type) {
        var html = "";
        if (type == "css") {
            for (var i in obj) {
                html += "<link rel='stylesheet' href='" + obj[i] + "'></link>\n";
            }
        } else {
            for (var j in obj) {
                html += "<script type='text/javascript' src='" + obj[j] + "'></script>\n";
            }
        }
        return html;
    }

    //function generateCSS(csss) {
    //    var html = "";
    //    for (var i in csss) {
    //        html += "<link rel='stylesheet' href='" + csss[i] + "'>";
    //    }
    //    return html;
    //}
}());
