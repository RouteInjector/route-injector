angular.module('schemaForm').directive('simpleSelect', ['$http', '$routeParams', 'models', function ($http, $routeParams, models) {

    return {
        restrict: 'AE',
        require: ['ngModel'],
        link: function (scope, element, attrs, ngModel) {
            scope.titleMap = [];

            var map = scope.$eval(attrs.map);
            var dynMap = scope.$eval(attrs.dynmap);
            var dynEnum = scope.$eval(attrs.dynenum);

            if(dynEnum){
                $http.get(dynEnum).then(function(res){
                    var resultMap = {};
                    angular.forEach(res.data, function(elem){
                        resultMap[elem] = elem;
                    });
                    setMap(resultMap);
                });
            } else if(dynMap){
                $http.get(dynMap).then(function(res){
                   setMap(res.data);
                });
            } else if(map){
                setMap(map);
            }

            function setMap(map){
                angular.forEach(Object.keys(map), function(key) {
                    var value = map[key];
                    var o = {};
                    o.value = key;
                    if(typeof(value)=="string") {
                        o.name = value;
                    } else {
                        o.name = value.name;
                        o.group = value.group;
                    }
                    scope.titleMap.push(o);
                });
            }
        }
    }
}]);