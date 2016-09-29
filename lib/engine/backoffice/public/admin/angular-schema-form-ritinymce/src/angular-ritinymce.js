angular.module('schemaForm').directive('riTinymce', ['$http', '$window', '$modal', function ($http, $window, $modal) {
    var count = 0;

    var defaultConf = {
        plugins: "code image -tinyvision autoresize fullscreen media link paste preview textcolor",
        toolbar1: "undo redo | styleselect fontsizeselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | preview | fullscreen | forecolor backcolor",
        image_advtab: true,
        forced_root_block: 'p',
        width: '100%',
        height: 400,
        autoresize_min_height: 400,
        autoresize_max_height: 800,
        fullscreen_new_window: true,
        skin_url: 'dist/extra/tinymce/skins/lightgray',
        fullscreen_settings: {
            theme_advanced_path_location: "top"
        },
        paste_preprocess: function (pl, o) {
            o.content = o.content.replace(/(<b>)/ig, "<strong>");
            o.content = o.content.replace(/(<\/b>)/ig, "</strong>");
            o.content = o.content.replace(/(<i>)/ig, "<em>");
            o.content = o.content.replace(/(<\/i>)/ig, "</em>");
        },
        //valid_elements: 'p,a[href],span[class],div[class],img[style|class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name]',
        tinyvision: {
            source: '/gallery',
            upload: function () {
                $modal.open({
                    templateUrl: 'imgUploader.html',
                    controller: 'ModalImgUploaderCtrl',
                    size: 'md'
                });
            }
        }
    };


    return {
        restrict: 'AC',
        require: 'ngModel',
        scope: false,
        link: function (scope, element, attrs, ngModel) {
            var tinymce;

            if (!attrs.id) {
                attrs.$set('id', 'ri-tinymce-' + count++);
            } else {
                //do we have real jQuery? or querySelector
                var focus = function () {
                    if (tinymce) {
                    }
                };
                if ($window.jQuery) {
                    jQuery('label[for=' + attrs.id + ']')
                }
            }

            var destroy = function () {
                if (tinymce) {
                    tinymce.save();
                    tinymce.remove();
                    tinymce = null;
                }
            };
            scope.destroy = destroy;

            scope.$on('$destroy', destroy);

            scope.$watch(attrs.ngModel, function (value, old) {
                if (tinymce && angular.isDefined(value)) {
                    var content = tinymce.getContent();
                    if (angular.isString(value) && content !== value) {
                        tinymce.setContent(value);
                    }
                }
            });

            var init = function (config) {
                config = angular.extend(config || {}, defaultConf, {
                    selector: '#' + attrs.id,
                    setup: function (ed) {
                        tinyMCE.PluginManager.load('tinyvision', '/admin/dist/extra/tinyvision/build/plugin.min.js');
                        tinymce = ed;
                        $window['focus' + attrs.id] = function () {
                            tinymce.execCommand('mceFocus', false, attrs.id);
                        };

                        var update = function () {
                            var content = ed.getContent();
                            if (ngModel.$viewValue !== content) {
                                ngModel.$setViewValue(content);

                                //certain things like 'destroy' below triggers update inside a $digest cycle.
                                if (!scope.$root.$$phase) {
                                    scope.$apply();
                                }
                            }
                        };

                        ed.on('change', update);
                        ed.on('KeyUp', update);
                        ed.on('ExecCommand', update);
                        ed.on('focus', function (e) {
                            angular.element(e.target.contentAreaContainer).addClass('tx-tinymce-active');
                        });
                        ed.on('blur', function (e) {
                            angular.element(e.target.contentAreaContainer).removeClass('tx-tinymce-active');
                        });
                    }
                });

                tinyMCE.init(config);
            };

            //If config is set watch it for changes, otherwise just init.
            if (attrs.riTinymce) {
                scope.$watch(attrs.riTinymce, function (c, old) {
                    destroy();
                    if (c) init(c);
                    else init();
                });
            } else {
                init();
            }
        }
    }
}])
    // Please note that $modalInstance represents a modal window (instance) dependency.
    // It is not the same as the $modal service used above.
    .controller('ModalImgUploaderCtrl', function ($scope, $modalInstance, $timeout) {
        $scope.success = false;
        $scope.error = false;
        $scope.$on('$dropletReady', function whenDropletReady() {
            $scope.dropletint.allowedExtensions(['png', 'jpg', 'bmp', 'gif']);
            $scope.dropletint.defineHTTPSuccess([200, 201]);
            $scope.dropletint.setRequestUrl('/gallery/insert');
        });

        $scope.$on('$dropletSuccess', function onDropletSuccess(event, response, files) {
            $modalInstance.close();
        });

        $scope.cancel = function () {
            $modalInstance.close();
        }

        $modalInstance.result.finally(function () {
            $('iframe').contents().find('#refresh').trigger('click');
        });

    });
