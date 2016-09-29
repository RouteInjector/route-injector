(function () {
    'use strict';
    angular.module('injectorApp')
        .factory('httpResponseInterceptor', ['$q', '$location', '$routeParams', 'flash', '$injector', function ($q, $location, $routeParams, flash, $injector, configs) {

            return {
                response: function (response) {
                    //console.log(response);
                    if (response.headers("routeinjector") && (response.headers("routeinjector") !== configs.backoffice.version)) {
                        var ngDialog = $injector.get("ngDialog");
                        if (ngDialog.getOpenDialogs().length === 0) {
                            ngDialog.open({
                                template: "dialogVersionMismatch",
                                className: 'ngdialog-theme-default ngdialog-theme-custom'
                            });
                        }
                    }
                    if (response.status === 401) {
                        console.log("Response 401");
                    } else if (response.status === 201) {
                        flash.success("Done", "Document saved successfully");
                    }
                    return response || $q.when(response);
                },
                responseError: function (rejection) {

                    var models = $injector.get("models");

                    var modelName = $routeParams.schema;
                    var modelId = $routeParams.id;

                    var errorInReferencedProperty;
                    var prefix = configs.app.prefix;

                    if (modelName) {
                        models.getModelConfig(modelName, function (model) {
                            var path = "/" + model.path + "/" + modelId;
                            if (prefix) {
                                path = "/" + path;
                            }

                            errorInReferencedProperty = path !== rejection.config.url;
                            handleError(errorInReferencedProperty);

                        });
                    } else {
                        handleError(true);
                    }

                    function handleError(ignoreError) {
                        function redirectError() {
                            if ($location.url() != "/login" && $location.url() != "/logout" && $location.url() != "/") {
                                if ($routeParams.schema) {
                                    $location.path('/model/' + $routeParams.schema);
                                } else {
                                    $location.path('/');
                                }
                            }
                        }

                        if (rejection.status === 401) {
                            console.log("Response Error 401", rejection);
                            redirectError();

                            if ($location.url() != "/login") {
                                flash.error("Unauthorized", JSON.stringify(rejection.data));
                            }
                        } else if (rejection.status === 500) {
                            flash.error("Internal server error", JSON.stringify(rejection.data));
                        } else if (rejection.status === 400) {  //Client error
                            flash.error("Bad Request", JSON.stringify(rejection.data));
                        } else if (rejection.status === 404 && !ignoreError) {
                            redirectError();
                            flash.error("Not Found", JSON.stringify(rejection.data));
                        } else if (rejection.status === 404 && ignoreError) {
                            flash.warning("Property Not Found", JSON.stringify(rejection.data));
                        } else if (rejection.status === 403) {
                            if (rejection.data && rejection.data.errors) {
                                var errors = [];
                                angular.forEach(Object.keys(rejection.data.errors), function (e) {
                                    errors.push("<strong>" + e + "</strong> validation failed. Caused by: " + rejection.data.errors[e].message);
                                });
                                errors.splice(0, 0, "Validation Error " + rejection.status + "");
                                flash.error.apply(this, errors);
                            } else {
                                flash.error("Validation Error " + rejection.status + "", JSON.stringify(rejection.data));
                            }
                        } else if (Math.floor(rejection.status / 100) == 4 || Math.floor(rejection.status / 100) == 5) {
                            redirectError();
                            flash.error("Error " + rejection.status, JSON.stringify(rejection.data));
                        }
                    }

                    return $q.reject(rejection);
                }
            };
        }
        ])
        .config(['$httpProvider', function ($httpProvider) {
            //Http Interceptor to check failures
            $httpProvider.interceptors.push('httpResponseInterceptor');
        }]);
}());
