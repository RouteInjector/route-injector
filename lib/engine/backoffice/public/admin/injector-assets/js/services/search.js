(function () {
    'use strict';
    angular.module('injectorApp')
        .factory('search', function ($rootScope, models) {
            var query = {};

            return {
                setQuery: function (q) {
                    query.query = q;
                },
                clearQuery: function() {
                    this.setQuery({});
                },
                getQuery: function () {
                    return query.query;
                },
                setSortBy: function (sort) {
                    query.sortBy = sort;
                },
                addSortBy: function(field, asc) {
                    query.sortBy = {};
                    query.sortBy[field] = asc ? 1 : -1;
                },
                getSort: function(field) {
                    if(query.sortBy) {
                        return query.sortBy[field];
                    } else {
                        return undefined;
                    }
                },
                setSkip: function(skip){
                    query.skip = skip;
                },
                setLimit: function(limit){
                    query.limit = limit;
                },
                search: function (schema,  callback) {
                    models.search(schema, query, function (elements, count) {
                        callback(elements, count, null);
                    });
                },
                searchAndGroup: function(schema, callback) {
                    //TODO: Montar la query con grupos
                    //TODO: Volver al modelController y añadir una columna de grupo (p.ej. count)
                    //TODO: Pintar !!
                }
            };

        });
}());
