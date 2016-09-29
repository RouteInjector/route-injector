(function () {
    'use strict';
    var app = angular.module('injectorApp', ['ngRoute', 'ngBiscuit', 'schemaForm', 'datePicker', 'ui.select',
            'ui.ace', 'ui.codemirror', 'ui.bootstrap', 'ngFileUpload', 'routeInjector-tinymce',
            'ngDroplet', 'punchCard', 'nvd3ChartDirectives', 'flash', 'ngDialog', 'angular-loading-bar',
            'pascalprecht.translate', 'ngCookies'],
        function ($rootScopeProvider) {
            $rootScopeProvider.digestTtl(15);
        })
        .run(function ($rootScope, configs) {
            console.log(configs);
            $rootScope.configs = configs;
        });

    angular.lazy("injectorApp")
        .resolve(['$http', function ($http) {
            return $http.get('/configs')
                .then(function (resp) {
                    app.constant('configs', resp.data);
                });
        }])
        .resolve(['$http', '$q', function ($http, $q) {

            var deferred = $q.defer();
            $http.get('/admin/extensions').then(function (resp) {
                app.constant('extensions', resp.data);

                var extensions = resp.data;
                var assets = $('asset-loader');
                var scripts = [];

                for (var i = 0; i < assets.length; i++) {
                    var cache = [];

                    var asset = assets[i];
                    var src = asset.attributes.src.nodeValue;
                    var type = asset.attributes.type.nodeValue;

                    if (src === 'files') {
                        if (extensions.files[type] && extensions.files[type].length) {
                            cache = cache.concat(extensions.files[type]);
                        }
                    } else if (src === 'pages') {
                        for (var j in extensions.pages) {
                            var p = extensions.pages[j];
                            if (p.backoffice) {
                                if (p[type] && p[type].length) {
                                    cache = cache.concat(p[type]);
                                }
                            }
                        }
                    }

                    if (type === 'css') {
                        asset.appendChild(createCSSNodes(cache));
                    } else if (type === 'js') {
                        if (cache && cache.length) {
                            scripts = scripts.concat(cache);
                        }
                    }
                }

                //$.getMultiScripts(scripts).done(function () {
                //    deferred.resolve();
                //});
                getScripts(scripts, function () {
                    deferred.resolve();
                });

            });

            return deferred.promise;
        }])
        .bootstrap();

    function createCSSNodes(obj) {
        var div = document.createElement('div');
        for (var i in obj) {
            var link = document.createElement('link');
            link.href = obj[i];
            link.rel = 'stylesheet';
            div.appendChild(link);
        }
        return div;
    }

    function getScripts(scripts, callback) {
        if(!scripts ||  !scripts.length){
            return callback();
        }
        var progress = 0;
        var internalCallback = function () {
            if (++progress == scripts.length) {
                $.ajaxSetup({async:true});
                callback();
            }
        };

        $.ajaxSetup({async:false});
        scripts.forEach(function (script) {
            $.getScript(script, internalCallback);
        });

    }

    $.getMultiScripts = function (arr, path) {
        var _arr = $.map(arr, function (scr) {
            return $.getScript((path || "") + scr);
        });

        _arr.push($.Deferred(function (deferred) {
            $(deferred.resolve);
        }));

        return $.when.apply($, _arr);
    };
})();