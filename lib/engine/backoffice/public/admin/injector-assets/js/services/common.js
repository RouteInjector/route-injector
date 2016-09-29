(function () {
    'use strict';
    angular.module('injectorApp')
        .factory('common', function ($rootScope) {

            var factory = {};

            factory.hasAngularVariable = function (url) {
                return (/\{{(.*)\}}/).test(url);
            };

            factory.deAngularizeUrl = function (doc, url) {
                return url.replace(/\{{(.*)\}}/g, function (ng, matched) {

                    var f = factory.getField(matched, doc);
                    return f;
                });
            };

            factory.getAngularVariables = function (url) {
                return /\{{(.*)\}}/.exec(url)[1];
            };

            factory.prettifyTitle = function (title, separator) {
                title = title || "";
                separator = separator || ".";
                return title
                    // look for "."  user.age will be User -> Age
                    //TODO: Look for separator instead of "."
                    .replace(/(\.([a-z]|[A-Z]))/g, function (str) {
                        return " <i class='fa fa-angle-right'></i> " + str.replace(".", "").toUpperCase();
                    })
                    // insert a space before all caps
                    .replace(/([A-Z])/g, ' $1')
                    // uppercase the first character
                    .replace(/^./, function (str) {
                        return str.toUpperCase();
                    });
            };

            /**
             * Gets field value in point separated {{field}} from the model {{element}}. Also accepts [] notation.
             * @param field
             * @param element
             * @returns {*}
             */
            factory.getField = function (field, element) {
                if (element) {
                    var splitted = field.split('.');
                    if (splitted instanceof Array && splitted.length > 0) {
                        var ret = element;
                        var returnArray;
                        var parentArr;
                        for (var path in splitted) {

                            //Method for extrat array[].a fields or array[0].a fields.
                            if ((/(\[\d*\])/).test(splitted[path])) {
                                //Is an array !!!
                                var rootElem = splitted[path].replace(/(\[\d*\])/, "");
                                var index = splitted[path].match(/(\d*)(?=\])/)[0];

                                if (ret) {
                                    if (index) {
                                        ret = ret[rootElem][index];
                                    }
                                    else {
                                        parentArr = rootElem;
                                    }
                                }
                            } else {
                                if (parentArr) {
                                    var tmp = ret;
                                    returnArray = [];
                                    for (var elem in tmp[parentArr]) {
                                        returnArray.push(tmp[parentArr][elem][splitted[path]]);
                                    }
                                } else {
                                    if (ret) {
                                        ret = ret[splitted[path]];
                                    }
                                }
                            }
                        }
                        if (returnArray) {
                            return returnArray;
                        }
                        return ret;
                    } else {
                        return element[field];
                    }
                }
            };

            /**
             * Sets value {{value}} to model {{model}} in the point sepparated field {{field}}
             * @param field
             * @param model
             * @param value
             */
            factory.setField = function (field, model, value) {
                if (model) {
                    var splitted = field.split('.');
                    if (splitted instanceof Array && splitted.length > 0) {
                        var ref = model;
                        for (var i = 0; i < splitted.length; i++) {
                            var path = splitted[i];
                            if ((/(\[\d*\])/).test(path)) {
                                var rootElem = path.replace(/(\[\d*\])/, "");
                                var index = path.match(/(\d*)(?=\])/)[0];

                                var newPath;
                                if (index === undefined) {
                                    for (var arrInd in ref[rootElem]) {
                                        newPath = splitted[i + 1];
                                        factory.setField(newPath, ref[rootElem][arrInd], value);
                                    }
                                } else {
                                    newPath = splitted[i + 1];
                                    factory.setField(newPath, ref[rootElem][index], value);
                                }
                            } else {
                                if (i < splitted.length - 1) {
                                    if (!ref[path]) {
                                        ref[path] = {};
                                    }
                                    ref = ref[path];
                                } else {
                                    ref[path] = value;
                                }
                            }
                        }
                    }
                }
            };


            /**
             * Obatins point separated field {{field}} from schema {{schema}}
             * @param field
             * @param schema
             * @returns {*}
             */
            /*factory.getFieldFromSchema = function (field, schema) {
             if (schema[field]) {
             return schema[field];
             } else {
             var elements = field.split('.');
             var retElem;
             for (var i in elements) {
             if (retElem && retElem.properties) {
             retElem = retElem.properties[elements[i]];
             } else if (retElem && retElem.denormalize && retElem.denormalize.indexOf(elements[i]) > -1) {
             //Todo: Call api and resolve the model field
             var refSchema = models.getModel(retElem.ref);
             retElem = getFieldFromSchema(elements[i], refSchema.schema);
             } else {
             retElem = schema[elements[i]];
             }
             }
             return retElem;
             }
             };*/

            /**
             * Obtains all the keys of an schema (using {{separator}} as nested level indicator)
             * @param schema
             * @param separator
             * @returns {Array}
             */
            factory.getAllSchemaFields = function (schema, separator) {
                separator = separator || ".";
                var fields = [];

                function searchFields(obj, parent) {
                    var keys = Object.keys(obj);
                    angular.forEach(keys, function (k) {
                        if (obj[k].properties) {
                            searchFields(obj[k].properties, parent ? (parent + separator + k) : k);
                        } else if (obj[k].denormalize) {
                            angular.forEach(obj[k].denormalize, function (field) {
                                fields.push((parent ? (parent + separator) : "") + k + separator + field);
                            });
                        } else {
                            fields.push(parent ? (parent + separator + k) : k);
                        }
                    });
                }

                searchFields(schema);

                return fields;
            };

            /**
             * Process the form and returns the schema form for the schemaForm module
             * @param form
             * @param submitButtons
             * @returns {*|string[]}
             */
            factory.processForm = function (form, submitButtons) {
                var showSubmitButtons = (submitButtons === undefined || submitButtons);
                var innerForm;

                if (form && form.tabs) {
                    innerForm = innerForm || [];
                    innerForm.push({
                        "type": "tabs",
                        "tabs": form.tabs
                    });
                } else if (form && form.items) {
                    innerForm = form.items;
                }

                innerForm = innerForm || ["*"];

                //TODO: Keep this comment out to wait if someone complains of missing feature
                //if (showSubmitButtons) {
                //    var hasSubmitButton = false;
                //    angular.forEach(innerForm, function (item) {
                //        if (item.type == "submit") {
                //            hasSubmitButton = true;
                //        }
                //    });
                //
                //    if (!hasSubmitButton) {
                //        innerForm.push({
                //            type: "submit",
                //            title: "Save"
                //        });
                //    }
                //
                //}

                return innerForm;
            };

            factory.randomNumber = function () {
                return (new Date()).getTime();
            };

            factory.getRandomQuery = function () {
                return '?r=' + factory.randomNumber();
            };

            return factory;
        });
}());