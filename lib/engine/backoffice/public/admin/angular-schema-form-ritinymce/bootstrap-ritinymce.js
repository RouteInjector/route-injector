angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/ritinymce/ritinymce.html","<!--<script type=\"text/javascript\" src=\"/admin/tinymce/tinymce.min.js\"></script>-->\r\n<div class=\"form-group\" ng-class=\"{\'has-error\': hasError()}\">\r\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\r\n    <textarea\r\n            ri-tinymce=\"form.tinymceOptions\"\r\n            ng-model=\"$$value$$\"\r\n            style=\"background-color: white\"\r\n            schema-validate=\"form\"\r\n            ></textarea>\r\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\r\n</div>\r\n\r\n<style>\r\n    .modal {\r\n        z-index: 15001 !important;\r\n    }\r\n\r\n    .modal-dialog {\r\n        z-index: 15001  !important;\r\n    }\r\n\r\n    #mce-modal-block {\r\n        z-index: 15000  !important;\r\n    }\r\n\r\n    .mce-floatpanel {\r\n        z-index: 15001  !important;\r\n    }\r\n\r\n    #mce-modal-block .mce-panel {\r\n        z-index: 15001  !important;\r\n    }\r\n\r\n    droplet {\r\n        display: inline-block;\r\n        z-index: 15003;\r\n        position: relative;\r\n        border-radius: 2px;\r\n        width: 100%;\r\n        height: 400px;\r\n        background-color: rgba(255, 255, 255, .1);\r\n        margin-top: -5px;\r\n        padding-top: 5px;\r\n        transition: box-shadow 0.35s;\r\n    }\r\n\r\n    droplet.event-dragover {\r\n        box-shadow: inset 0 0 100px rgba(255, 255, 255, .25), inset 0 0 5px rgba(255, 255, 255, .25);\r\n    }\r\n\r\n    droplet ul.files {\r\n        height: 100%;\r\n        width: 100%;\r\n        overflow-y: auto;\r\n        padding: 5px;\r\n        list-style-type: none;\r\n        transition: all .5s;\r\n    }\r\n\r\n    droplet ul.files li {\r\n        width: 100px;\r\n        height: 100px;\r\n        padding: 1px;\r\n        float: left;\r\n        position: relative;\r\n        margin: 5px;\r\n    }\r\n\r\n    droplet ul.files li img.droplet-preview {\r\n        max-width: 96px;\r\n        background-size: cover;\r\n        background-repeat: no-repeat;\r\n        height: 96px;\r\n        width: 96px;\r\n        background-color: white;\r\n        box-shadow: 0 0 10px rgba(0, 0, 0, .25);\r\n        border: 1px solid white;\r\n        display: block;\r\n    }\r\n\r\n    droplet ul.files li div.delete {\r\n        background-color: rgba(0, 0, 0, .25);\r\n        width: 50px;\r\n        height: 50px;\r\n        font-family: Lato, Arial, Tahoma, Helvetica, sans-serif;\r\n        color: white;\r\n        font-size: 25px;\r\n        text-shadow: 1px 1px 0 rgba(0, 0, 0, .25);\r\n        text-align: center;\r\n        cursor: pointer;\r\n        line-height: 50px;\r\n        position: absolute;\r\n        border-radius: 50%;\r\n        z-index: 1010;\r\n        top: 25px;\r\n        left: 25px;\r\n        opacity: 0;\r\n        transition: all .30s;\r\n        transform: scale(0.5);\r\n    }\r\n\r\n    droplet ul.files li:hover div.delete {\r\n        opacity: 1;\r\n        transform: scale(1);\r\n    }\r\n\r\n    droplet ul.files li div.delete:hover {\r\n        background-color: rgba(0, 0, 0, .45);\r\n    }\r\n\r\n    droplet ul.files li div.size {\r\n        background-color: rgba(255, 255, 255, .5);\r\n        position: absolute;\r\n        bottom: 5px;\r\n        right: 5px;\r\n        pointer-events: none;\r\n        font-size: 9px;\r\n        font-family: Lato, Arial, Tahoma, Helvetica, sans-serif;\r\n        padding: 1px 4px;\r\n    }\r\n</style>\r\n\r\n\r\n<!--MODAL FOR VALIDATION-->\r\n<script type=\"text/ng-template\" id=\"imgUploader.html\">\r\n    <div class=\"modal-header\">\r\n        <h3 class=\"modal-title\">Upload Files</h3>\r\n    </div>\r\n    <div class=\"modal-body\">\r\n        <droplet ng-model=\"dropletint\">\r\n\r\n            <!--<div class=\"loading\" ng-class=\"{ visible: dropletint.isUploading() }\">\r\n                <svg viewBox=\"0 0 400 400\">\r\n                    <path class=\"loading-path\" data-progressbar ng-model=\"dropletint.progress.percent\"\r\n                          d=\"M 0,1 L 398,1 L 398,234 L 1,234 L 0,1\"\r\n                          stroke=\"#D3B2D1\" stroke-width=\"1\" fill-opacity=\"0\"\r\n                          style=\"stroke-dasharray: 392px, 392px;stroke-dashoffset: 392px;\"></path>\r\n                </svg>\r\n            </div>-->\r\n\r\n            <section ng-show=\"dropletint.isUploading()\">Upload done. Press Cancel button or ESC key</section>\r\n\r\n            <ul class=\"files\">\r\n                <li ng-hide=\"dropletint.isUploading()\" ng-repeat=\"filemodel in dropletint.getFiles(dropletint.FILE_TYPES.VALID)\">\r\n                    <droplet-preview ng-model=\"filemodel\"></droplet-preview>\r\n                    <div class=\"delete\" ng-click=\"filemodel.deleteFile()\">&times;</div>\r\n                    <div class=\"size\">{{filemodel.file.size / 1024 / 1024 | number: 1}}MB</div>\r\n                </li>\r\n            </ul>\r\n        </droplet>\r\n    </div>\r\n    <div class=\"modal-footer\">\r\n        <button class=\"btn btn-default\" ng-click=\"cancel()\">Cancel</button>\r\n        <button class=\"btn btn-primary\" ng-click=\"dropletint.uploadFiles()\" ng-hide=\"dropletint.isUploading()\">\r\n            Upload files\r\n        </button>\r\n    </div>\r\n</script>\r\n");}]);
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

angular.module('routeInjector-tinymce', ['schemaForm']).config(
['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
  function(schemaFormProvider,  schemaFormDecoratorsProvider, sfPathProvider) {

    var wysiwyg = function(name, schema, options) {
    if (schema.type === 'string' && schema.format == 'html') {
      var f = schemaFormProvider.stdFormObj(name, schema, options);
      f.key  = options.path;
      f.type = 'wysiwyg';
      f.tinymceOptions = schema.tinymceOptions;
      options.lookup[sfPathProvider.stringify(options.path)] = f;
      return f;
    }
  };

    schemaFormProvider.defaults.string.unshift(wysiwyg);

  //Add to the bootstrap directive
    schemaFormDecoratorsProvider.addMapping('bootstrapDecorator', 'wysiwyg',
    'directives/decorators/bootstrap/ritinymce/ritinymce.html');
    schemaFormDecoratorsProvider.createDirective('wysiwyg',
    'directives/decorators/bootstrap/ritinymce/ritinymce.html');
  }]);
