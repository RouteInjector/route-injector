(function () {
    'use strict';

    angular.module('injectorApp')
        .directive('groupInModel', ['$http', '$routeParams', 'models', 'common', 'search', function ($http, $routeParams, models, common, search) {
            return {
                restrict: 'AE',
                scope: false,
                templateUrl: 'dist/js/directives/group-model/group-model.html',
                link: function (scope, element, attrs, ngModel) {
                    var modelName = $routeParams.schema;
                    scope.groupBy = "";
                    scope.availableGroups = [];

                    models.getModelSchema(modelName, function (schema) {
                        if (schema) {
                            scope.allFields = common.getAllSchemaFields(schema);
                            scope.availableGroups = scope.allFields.filter(function (val) {
                                var f = models.getFieldFromSchema(val, schema);
                                return (f && f.format != "image" && f.format != "mixed");
                            });
                        }
                    });

                    scope.doGroupBy = function(field){
                        console.log("Group BY", field);
                        if(field) {
                            var jsonSort = {};
                            angular.forEach(field, function(value){
                                jsonSort[value] = 1;
                            });

                            search.setSortBy(jsonSort);
                            search.setSkip(0);
                            scope.$parent.search();
                        }
                    };
                }
            };
        }]);
}());
