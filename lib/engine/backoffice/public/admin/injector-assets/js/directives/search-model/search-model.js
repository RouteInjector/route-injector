(function () {
    'use strict';

    angular.module('injectorApp')
        .directive('searchInModel', ['$routeParams', 'models', 'common', 'search', function ($routeParams, models, common, search) {
            return {
                restrict: 'AE',
                scope: false,
                templateUrl: 'dist/js/directives/search-model/search-model.html',
                link: function (scope, element, attrs, ngModel) {
                    scope.searches = [];
                    scope.models = models;
                    var modelName = $routeParams.schema;


                    scope.buildPath = function (field, schema) {
                        var sc = models.getFieldFromSchema(field, schema);
                        var title;
                        if (sc && sc.title) {
                            var i = field.lastIndexOf(".");
                            if (i > -1 && sc.title.indexOf("<i") == -1) {//TODO: ÑAPA DE LAS GUAPAS, ESTO HAY QUE CAMBIARLO
                                title = common.prettifyTitle(field.substring(0, i) + '.' + sc.title);
                            } else {
                                title = sc.title;
                            }

                        } else {
                            title = common.prettifyTitle(field);
                        }

                        return title;
                    };

                    scope.updateSearch = function (elemSearch, field, noSearch) {
                        var index;
                        if (elemSearch.field) {
                            index = scope.availableFields.indexOf(elemSearch.field);
                            if (index == -1) {
                                scope.availableFields.push(elemSearch.field);
                            }
                        }

                        var fieldFromSchema = models.getFieldFromSchema(field, scope.schema);

                        elemSearch.title = fieldFromSchema.title;
                        elemSearch.field = field;
                        //elemSearch.placeholder = "Search in " + modelName + " by " + elemSearch.field;
                        elemSearch.placeholder = {modelName: modelName, field: elemSearch.field};
                        elemSearch.ref = (fieldFromSchema.ref && !fieldFromSchema.denormalize) ? fieldFromSchema.ref : undefined;

                        //console.log(elemSearch);

                        index = scope.availableFields.indexOf(field);
                        if (index > -1) {
                            scope.availableFields.splice(index, 1);
                        }

                        if (!noSearch) {
                            scope.search();
                        }
                    };

                    scope.addSearch = function (field) {
                        var s = {};
                        field = field || scope.availableFields[0];

                        s.clear = function () {
                            s.value = "";
                            scope.search();
                        };

                        s.remove = function () {

                            var index = scope.searches.indexOf(s);
                            if (index > -1) {
                                scope.searches.splice(index, 1);
                            }

                            index = scope.availableFields.indexOf(s.field);
                            if (index == -1) {
                                scope.availableFields.push(s.field);
                            }
                            scope.search();
                        };

                        scope.updateSearch(s, field, true);
                        scope.searches.push(s);
                    };

                    models.getModelSchema(modelName, function (schema) {
                        if (schema) {
                            scope.schema = schema;
                            scope.allFields = common.getAllSchemaFields(schema);
                            scope.availableFields = scope.allFields.filter(function (val) {
                                var f = models.getFieldFromSchema(val, schema);
                                return (f && f.format != "image" && f.format != "mixed");
                            });
                        }
                    });
                    models.getModelConfig(modelName, function (config) {
                        scope.addSearch(config.displayField);
                    });

                    /*scope.$on('$routeChangeSuccess', function (event, current, previous) {
                     searchFunc(current.params.schema);
                     });*/

                    //scope.newSearch = function () {
                    //    scope.addSearch(scope.availableFields[0]);
                    //};

                    scope.search = function () {
                        var query = {};

                        models.getModelSchema(modelName, function (schema) {
                            angular.forEach(scope.searches, function (s) {
                                var singleQuery = {};
                                if (s.value) {
                                    var sfield = models.getFieldFromSchema(s.field, schema);
                                    if (sfield) {
                                        if (sfield.type == "string" && !sfield.format && !sfield.ref) {
                                            if (s.value !== "") {
                                                singleQuery[s.field] = {$regex: s.value, $options: 'i'};
                                            }
                                        } else if (sfield.type == "string" && sfield.format == "date") {
                                            if (s.value !== "") {
                                                singleQuery[s.field] = s.value;
                                            }
                                        } else if (sfield.ref && !sfield.denormalize) {
                                            singleQuery[s.field] = s.value;
                                            //References may be we should load before some useful information for querying references
                                        } else if (sfield.ref && sfield.denormalize) {
                                            singleQuery[s.field] = {$regex: s.value, $options: 'i'};
                                        } else {
                                            singleQuery[s.field] = s.value;
                                        }
                                    }
                                }
                                angular.extend(query, singleQuery);
                            });
                        });

                        search.setQuery(query);
                        search.setSkip(0);
                        scope.$parent.search();

                    };
                }
            };
        }])
        .directive("searchRefInModel", ['models', 'common', function (models, common) {
            return {
                restrict: 'AE',
                scope: false,
                templateUrl: 'dist/js/directives/search-model/search-ref-model.html',
                link: function (scope, element, attrs, ngModel) {
                    scope.elemsearch = scope.$eval(attrs.elemsearch);
                    var ref = scope.elemsearch.ref;

                    if (!element.select) {
                        return;
                    }

                    var displayField = "";
                    var idSelect = "";

                    function getDocumentById(modelId) {
                        return function (query, skip) {
                            return models.getModel(ref, function (m) {
                                var config = m.config;
                                var elem = "";
                                if (modelId instanceof Object) {
                                    elem = modelId[config.id];
                                } else {
                                    elem = modelId;
                                }
                                models.getDocument(ref, elem, function (doc) {
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

                                    q.limit = 20;
                                    q.skip = skip;

                                    //SHARDING
                                    if (models.getShard(ref)) {
                                        q[models.getShard(ref).key] = models.getShard(ref).value;
                                    }

                                    models.search(ref, q, function (response, count) {
                                        if (skip) {
                                            scope.searchRes = scope.searchRes.concat(response);
                                        } else {
                                            scope.searchRes = response;
                                        }

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
                        };
                    }

                    var elements = getDocumentById(scope.$eval(attrs.ngModel));

                    scope.disabled = false;
                    scope.searchEnabled = true;
                    scope.searchRes = [];
                    scope.search = elements;

                    scope.printSelectedElement = function (document) {
                        if (document) {
                            var f = common.getField(displayField, document);
                            if (f && f !== "" && f.length > 0) {
                                return f + " <" + document[idSelect] + ">";
                            } else {
                                return "No display field. ID: <" + document[idSelect] + ">";
                            }
                        }
                    };

                    scope.selectDisplayField = function (document) {
                        if (document) {
                            var f = common.getField(displayField, document);
                            if (f && f !== "" && f.length > 0) {
                                return f;
                            } else {
                                return "<empty>";
                            }
                        }
                    };

                    scope.selectIdField = function (document) {
                        if (document !== undefined) {
                            return document[idSelect] || "No ID";
                        }
                    };

                    scope.$on('refreshSelect2' + ref, function () {
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
            };
        }]);
}());
