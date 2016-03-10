var express = require('express');
var router = express.Router();

var path = require('path');
var fs = require('fs');
var parseString = require('xml2js').parseString;
var multiparty = require('multiparty');
var unzip = require('unzip2');
var uuid = require('node-uuid');

var common = require('../classes/common');

/* GET sco resources view */
router.get('/view/sco/*', function(req, res, next) {
    var url = req.url.split('/view/sco/')[1];
    url = url.split('?')[0];

    var file = path.resolve(__dirname + '/../scorm/packages/' + url);

    console.log("Loading scorm file: " + file);

    // At this point we need to check if the file is in scorm package imsmanifest as public file.

    if (fs.existsSync(file)) {
        res.sendFile(file);
    } else {
        res.status(404);
        res.render('error', {
            message: 'File not found',
            error: {
                'status': '404'
            }
        });
    }
});

/* GET sco view */
router.get('/view/:id', function(req, res, next) {
    var id = (req.params.id == undefined ? false : req.params.id);

    var imsmanifestPath = __dirname + '/../scorm/packages/' + id + '/imsmanifest.xml';
    if (fs.existsSync(imsmanifestPath)) {
        var imsmanifest = fs.readFileSync(imsmanifestPath);

        parseString(imsmanifest, function (err, result) {
            if( !err ) {
                imsmanifest = result.manifest;
                res.render('scorm/view', {
                    title: 'Scorm - Player',
                    id: id,
                    imsmanifest: JSON.stringify(imsmanifest)
                });
            }
        });
    } else {
        res.status(404);
        res.render('error', {
            message: 'File not found',
            error: {
                'status': '404'
            }
        });
    }
});

/* GET sco install */
router.get('/install', function(req, res, next) {
    res.render('scorm/install', {
        title: 'Scorm - Install'
    });
});

/* POST sco install */
router.post('/install', function(req, res, next) {
    var form = new multiparty.Form();

    form.parse(req, function(err, fields, files) {
        console.log(files);

        var extension = path.extname(files.file[0].path);

        if( extension.toLowerCase() == ".zip" ) {
            var id = uuid.v4();

            fs.createReadStream(files.file[0].path).pipe(unzip.Extract({path: 'scorm/packages/' + id}));

            res.json({
                success: true,
                package: id
            });
        } else {
            res.json({
                success: false,
                error: "Incorrect file, the file maybe ZIP"
            });
        }
    });
});

/* GET sco delete */
router.get('/delete/:id', function(req, res, next) {
    var id = (req.params.id == undefined ? false : req.params.id);

    var folder = __dirname + '/../scorm/packages/' + id;
    if (fs.existsSync(folder)) {
        common.deleteFolderRecursive(folder);
    }

    res.redirect('/');
});

module.exports = router;