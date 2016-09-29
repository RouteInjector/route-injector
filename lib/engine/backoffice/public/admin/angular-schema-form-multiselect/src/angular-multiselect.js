angular.module('schemaForm').directive('selectMultiple', ['$http', '$routeParams', 'models', 'common', function ($http, $routeParams, models, common) {
    function convertToMap(elements){
        var map = [];
        angular.forEach(elements, function(val) {
            if(val.name && val.value){
                map.push(val);
            } else if(val.split) { // is a string)
                map.push({name: val, value: val});
            } else{
                console.error("Invalid value", val, "for multiselect element")
            }
        });

        return map;
    }

    function addStringToMap(val, map){
        var exists = false;
        angular.forEach(map, function(v){
            if(v.value == val){
                exists = true;
            }
        });

        if(!exists) {
            map.push({name: val, value: val});
        }

        return map;
    }

    return {
        restrict: 'AE',
        scope: false,
        link: function (scope, element, attrs, ngModel) {

            //WAIT TO LOAD :)
            //$('body').delegate('.page-sidebar li > a', 'click',  function (e) {});


            scope.common = common;
            scope.grouping = false;
            scope.separator = scope.$eval(attrs.separator);
            scope.url = scope.$eval(attrs.url);
            scope.lock = scope.$eval(attrs.lock);
            scope.availableElems = [];
            scope.placeholder = "Select";
            scope.enum = scope.$eval(attrs.enum);
            scope.map = scope.$eval(attrs.map);

            if(scope.separator){
                scope.group = function(item){
                    return item.name.split(scope.separator)[0];
                };
                scope.grouping = true;
            }

            scope.getTitle = function(val){
                if(scope.separator){
                    var splitted = val.name.split(scope.separator);
                    splitted.splice(0,1);
                    var value = splitted.join(scope.separator);
                    return common.prettifyTitle(value, scope.separator);
                } else {
                    return common.prettifyTitle(val.name);
                }
            };

            scope.refreshData = function (item) {
                if(!scope.lock) {
                    if (item) {
                        scope.availableElems = addStringToMap(item, scope.availableElems);
                    }
                }
            };

            if(scope.url){
                if(common.hasAngularVariable(scope.url)){
                    if ($routeParams.id) {
                        models.getDocument($routeParams.schema, $routeParams.id, function (doc) {
                            var a = common.deAngularizeUrl(doc, scope.url);
                            $http.get(a).then(function (elems) {
                                var d = elems.data;
                                if (d instanceof Array) {
                                    scope.availableElems = convertToMap(d);
                                } else {
                                    console.error("Invalid values for multiselect", "values:", d);
                                }
                            });
                        });
                    } else {
                        scope.placeholder = "Cannot resolve variable " + common.getAngularVariables(scope.url) + ". Please save the document first";
                        scope.availableElems = convertToMap(scope.$eval(attrs.choices) || []);
                    }
                } else {
                    $http.get(scope.url).then(function (elems) {
                        var d = elems.data;
                        if (d instanceof Array) {
                            scope.availableElems = convertToMap(d);
                        } else {
                            console.error("Invalid values for multiselect", "values:", d);
                        }
                    });
                }

            } else {
                if(scope.map){
                    scope.availableElems = convertToMap(scope.map);
                } else if(scope.enum){
                    scope.availableElems = convertToMap(scope.enum);
                } else {
                    console.error("Bad configuration for multiselect");
                }
            }
        }
    }
}]);
