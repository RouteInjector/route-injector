(function () {
    'use strict';
    angular.module('injectorApp')

    .controller('ShardingController', function ($scope, $routeParams, $rootScope, models, configs) {
        var modelName;
        $scope.$on('$routeChangeSuccess', function (event, current) {
            modelName = current.params.schema;
            if (modelName) {
                models.getModel(modelName, function (m) {
                    if (m.config.shard) {
                        $scope.shardKey = m.config.shard.shardKey;
                        $scope.shardKeyText = 'Select ' + $scope.shardKey + ' shard';
                        $scope.shardValues = m.config.shard.shardValues;

                        if (models.getShard(modelName)) {
                            $scope.shardKeyText = 'Using ' + models.getShard(modelName).key + ' ' + models.getShard(modelName).value;
                        } else{
                            if(m.config.shard.filtered){
                                $scope.locked = true;
                                $scope.setShard($scope.shardValues[0]);
                            } else{
                                $scope.locked = false;
                            }                           
                        }

                    } else {
                        $scope.shardKey = undefined;
                        $scope.shardKeyText = undefined;
                        $scope.shardValues = undefined;
                    }
                });
            } else {
                $scope.shardKey = undefined;
                $scope.shardKeyText = undefined;
                $scope.shardValues = undefined;
            }
        });

        $scope.setShard = function (value) {
            $scope.shardKeyText = 'Using ' + $scope.shardKey + ' ' + value;
            models.setShard($scope.shardKey, value, modelName);

            $rootScope.$broadcast('shardChangeEvent');
        };

        $scope.removeShard = function () {
            $scope.shardKeyText = 'Select ' + $scope.shardKey + ' shard';
            //models.setShard($scope.shardKey, '', modelName);
            models.removeShard(modelName);
            $rootScope.$broadcast('shardChangeEvent');
        };
        $scope.shardKey = undefined;
    });
}());