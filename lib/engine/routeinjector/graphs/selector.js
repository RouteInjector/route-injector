var punchgraph = require("./punchgraph");
var geograph = require("./geograph");
var bargraph = require("./bargraph");

exports.select = function(Model){
    return function(req, res){
        var config = Model.injector();
        var graphs = config.graphs;

        for(var i in graphs){
            var graph = graphs[i];
            if(req.params.id == graph.title){
                switch(graph.type){
                    case "punchcard":
                        punchgraph.punchgraph(Model,graph)(req, res);
                        break;
                    case "geograph":
                        geograph.geograph(Model,graph)(req, res);
                        break;
                    case "bargraph":
                        bargraph.bargraph(Model,graph)(req, res);
                        break;
                    default:
                        res.json("invalid graph")
                        res.end();
                        break;

                }
            }
        }
    }
};


