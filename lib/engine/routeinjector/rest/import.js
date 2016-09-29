var fs = require('fs');
var JSZip = require('node-zip');
var async = require('async');

module.exports.import = function (Model) {
    return function (req, res) {
        var format = req.body.format;
        var file = req.files.fileData;
        var fileData = fs.readFileSync(file, 'binary');

        if(format == "csv"){

        } else if(format == "xlsx"){

        } else if(format == "json") {

        } else if(format == "json+zip") {
            var zip = new JSZip(fileData, {base64: false, checkCRC32: true});

            async.forEach(zip.files, function (docFile) {
                var doc = new Model(docFile);
                Model.save(doc);
            });
        }

        return res.end();
    }
};