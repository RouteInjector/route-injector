angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/select2/select2.html","<style>\r\n    .select2 > .select2-choice.ui-select-match {\r\n        /* Because of the inclusion of Bootstrap */\r\n        height: 29px;\r\n    }\r\n\r\n    .selectize-control > .selectize-dropdown {\r\n        top: 36px;\r\n    }\r\n</style>\r\n\r\n<div class=\"form-group {{form.htmlClass}}\" ng-class=\"{\'has-error\': hasError()}\">\r\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\r\n\r\n    <div class=\"input-group\">\r\n        <ui-select select2-search\r\n                   ng-show=\"form.key\"\r\n                   ng-model=\"$$value$$\"\r\n                   ng-model-options=\"form.ngModelOptions\"\r\n                   ng-disabled=\"form.readonly\"\r\n                   sf-changed=\"form\"\r\n                   ref=\"form.ref\"\r\n                   query=\"form.query\"\r\n                   shard=\"form.shard\"\r\n                   depends-on=\"form.dependsOn\">\r\n            <ui-select-match allow-clear=\"true\"\r\n                    ng-model=\"$$value$$\" placeholder=\"Search for {{form.title}}\">\r\n                {{printSelectedElement($select.selected)}}\r\n            </ui-select-match>\r\n            <ui-select-choices\r\n                    sf-changed=\"form\"\r\n                    ng-model=\"$$value$$\" refresh=\"search($select)\" refresh-delay=\"0\"\r\n                    repeat=\"selectIdField(item) as item in searchRes\">\r\n                <div ng-bind-html=\"selectDisplayField(item) | highlight: $select.search\"></div>\r\n                <small>\r\n                    <i>&lt;<span ng-bind-html=\"selectIdField(item)\"></span>&gt;</i>\r\n                </small>\r\n            </ui-select-choices>\r\n        </ui-select>\r\n        <span class=\"input-group-btn\">\r\n            <create-update-modal class=\"btn btn-primary\"\r\n                                 ng-model=\"$$value$$\"\r\n                                 sf-changed=\"form\"\r\n                                 ref=\"form.ref\" ng-click=\"open()\">New {{form.ref}}\r\n            </create-update-modal>\r\n            <create-update-modal class=\"btn btn-warning\"\r\n                                 ng-model=\"$$value$$\"\r\n                                 sf-changed=\"form\"\r\n                                 ref=\"form.ref\" type=\"edit\" ng-show=\"$$value$$\" ng-click=\"open()\">Edit\r\n            </create-update-modal>\r\n            <!--<button class=\"btn btn-primary\" ng-click=\"open()\">Create {{form.title}}</button>-->\r\n        </span>\r\n    </div>\r\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\r\n</div>\r\n\r\n<script type=\"text/ng-template\" id=\"createUpdateModal.html\">\r\n    <div class=\"modal-header\">\r\n        <h3 class=\"modal-title\">Create a new {{schema.title}}</h3>\r\n    </div>\r\n    <div class=\"modal-body\">\r\n        <form name=\"ngForm\" sf-schema=\"schema\" sf-form=\"form\" sf-model=\"model\" ng-submit=\"submitForm(ngForm,model)\">\r\n            <input type=\"submit\" id=\"submit-form-{{schema.title}}\" class=\"hidden\"/></form>\r\n    </div>\r\n    <div class=\"modal-footer\">\r\n        <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\r\n        <label class=\"btn btn-primary\" for=\"submit-form-{{schema.title}}\">Save</label><!--Ñapon del 15, pero fa el submit sense haver de fer coses rares :)-->\r\n    </div>\r\n</script>");}]);
angular.module('schemaForm').directive('select2Search', ['$http', '$routeParams', 'models', 'common', 'selectCache', function ($http, $routeParams, models, common, selectCache) {

    return {
        restrict: 'A',
        scope: true,
        require: ['ngModel'],
        link: function (scope, element, attrs, ngModel) {
            var modelName = $routeParams.schema;
            var shard = $routeParams.shard;

            if (!element.select)
                return;

            var displayField = "";
            var idSelect = "";
            var userq = scope.$eval(attrs.query);

            var userShard = scope.$eval(attrs.shard);
            if(userShard) {
                userShard.replace('/this\./', scope.$eval(attrs.key));
                var actualShard = common.getField(userShard, scope.model);
                if(actualShard){
                    shard = actualShard;
                }
            }

            var dependsOn = scope.$eval(attrs.dependsOn);
            if (dependsOn) {
                dependsOn = dependsOn.split("=");
            }

            function getDocumentById(modelId) {
                return function (query, skip) {
                    return models.getModel(scope.$eval(attrs.ref), function (m) {
                        var config = m.config;
                        var elem = "";

                        if (modelId instanceof Object) {
                            elem = modelId[config.id];
                        } else {
                            elem = modelId;
                        }

                        selectCache.getDocument(scope.$eval(attrs.ref), elem, shard, function (doc) {
                            displayField = config.displayField;
                            idSelect = config.id;

                            var q = {};
                            q.query = {};
                            var regex = query.search;
                            q.query.$or = [];

                            var forDisplay = {};
                            forDisplay[displayField] = {$regex: regex, $options: 'i'};
                            q.query.$or.push(forDisplay);


                            if (config.id != "_id" && m.schema[config.id] && m.schema[config.id].type == "string") {
                                var forID = {};
                                forID[idSelect] = {$regex: regex, $options: 'i'};
                                q.query.$or.push(forID);
                            }

                            if (dependsOn) {
                                if (dependsOn[0] && scope.model[dependsOn[1]]) {
                                    if (!isValidObjectID(scope.model[dependsOn[1]])) {
                                        q.query[dependsOn[0]] = {
                                            $regex: scope.model[dependsOn[1]],
                                            $options: 'i'
                                        };
                                    } else {
                                        q.query[dependsOn[0]] = scope.model[dependsOn[1]];
                                    }
                                }
                            }

                            function isValidObjectID(str) {
                                // A valid Object Id must be 24 hex characters
                                return (/^[0-9a-fA-F]{24}$/).test(str);
                            }

                            q.limit = 20;
                            q.skip = skip;

                            angular.extend(q, userq || {});
                            selectCache.search(scope.$eval(attrs.ref), q, shard, function (response, count) {
                                if (skip)
                                    scope.searchRes = scope.searchRes.concat(response);
                                else
                                    scope.searchRes = response;

                                if (doc) {
                                    var present = scope.searchRes.some(function (element) {
                                        return element[config.id] == doc[config.id];
                                    });

                                    if (!present) {
                                        scope.searchRes.splice(0, 0, doc);
                                    }
                                }
                            });
                        });
                    });
                }
            }

            var elements = getDocumentById(scope.$eval(attrs.ngModel));

            scope.$watch(function () {
                if (dependsOn) {
                    if (scope.model[dependsOn[1]])
                        return scope.model[dependsOn[1]];
                }
            }, function (newValue) {
                getDocumentById(scope.$eval(attrs.ngModel))({search: ''});
            });

            scope.disabled = false;
            scope.searchEnabled = true;
            scope.searchRes = [];
            scope.search = elements;

            scope.printSelectedElement = function (document) {
                if (document) {
                    var f = common.getField(displayField, document);
                    if (f && f != "" && f.length > 0)
                        return f + " <" + document[idSelect] + ">";
                    else {
                        return "No display field. ID: <" + document[idSelect] + ">";
                    }
                }
            };

            scope.selectDisplayField = function (document) {
                if (document) {
                    var f = common.getField(displayField, document);
                    if (f && f != "" && f.length > 0)
                        return f;
                    else {
                        return "<empty>";
                    }
                }
            };

            scope.selectIdField = function (document) {
                if (document != undefined) {
                    return document[idSelect] || "No ID";
                }
            };

            scope.$on('refreshSelect2' + scope.$eval(attrs.ref), function () {
                console.log("REFRESH SELECT2");
                elements();
            });

            element.find('ul').bind('scroll', function () {
                var raw = arguments[0].target;
                if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
                    elements(scope.$select, (raw.children[0].children.length - 2));
                }
            });
        }
    }
}
])
;

var modalController = function ($scope, $http, $modalInstance, $routeParams, models, configs, modelName, id, dependsOn, common) {
    //Override the functinos for every opened modal (fixes problem with residual variables)
    var fromSchema = $routeParams.schema;
    $routeParams.schema = modelName;
    $routeParams.id = id;

    //TODO: Maybe we should avoid duplicate code with formController !
    models.getModel(modelName, function (m) {
        var s = m.schema;
        var base = function (doc) {
            $scope.schema = {
                "type": "object",
                "title": modelName,
                "action": (doc) ? "Edit" : "New",
                "properties": s
            };

            var innerForm = common.processForm(m.config.form, false);

            $scope.form = innerForm;

            $scope.model = doc || {};

            if (!doc && models.getShard(fromSchema) && models.getShard(fromSchema).value) {
                $scope.model[models.getShard(fromSchema).key] = models.getShard(fromSchema).value;
            }

            dependsOn.apply($scope, modelName, $scope.model);

            $scope.submitForm = function (form, model) {
                // First we broadcast an event so all fields validate themselves
                $scope.$broadcast('schemaFormValidate');
                // Then we check if the form is valid
                if (form.$valid) {
                    if ($scope.schema.action === "New") {
                        models.postDocument(modelName, model, function (response) {
                            if (response.status == '201') {
                                $scope.$broadcast('postedDocument', response.data);
                                $modalInstance.close('saved');
                            }
                        });
                    } else {
                        models.putDocument(modelName, id, model, function (response) {
                            if (response.status == '200') {
                                $scope.$broadcast('postedDocument', response.data);
                                $scope.$broadcast('puttedDocument', response.data);
                                $modalInstance.close('saved');
                            }
                        });
                    }
                } else {
                    alert('invalid form');
                }
            }
        };

        if (id) {
            models.getDocument(modelName, id, function (document) {
                base(document);
            });
        } else {
            base();
        }
    });

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

angular.module('schemaForm').directive('createUpdateModal', ['$http', '$routeParams', '$rootScope', '$modal', 'models', function ($http, $routeParams, $rootScope, $modal, models) {
    return {
        restrict: 'E',
        scope: true,
        require: ['ngModel'],
        link: function (scope, element, attrs, ngModel) {
            scope.open = function () {
                var modalInstance = $modal.open({
                    templateUrl: 'createUpdateModal.html',
                    controller: modalController,
                    size: 'lg',
                    resolve: {
                        modelName: function () {
                            return scope.$eval(attrs.ref);
                        },
                        id: function () {
                            if (attrs.type == "edit")
                                return scope.$eval(attrs.ngModel);
                            else
                                return "";
                        }
                    }
                });

                modalInstance.result.then(function () {
                    $rootScope.$broadcast('refreshSelect2' + scope.$eval(attrs.ref));
                }, function () {
                    console.info('Modal dismissed at: ' + new Date());
                });
            };
        }
    }
}]);
angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
            var select2 = function (name, schema, options) {
                if (schema.ref) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'select2';
                    f.query = schema.query;
                    f.ref = schema.ref;
                    f.shard = schema.shard;
                    f.dependsOn = schema.dependsOn;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(select2);
            schemaFormProvider.defaults.object.unshift(select2);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'select2',
                'directives/decorators/bootstrap/select2/select2.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'select2',
                'directives/decorators/bootstrap/select2/select2.html'
            );
        }
    ]);
