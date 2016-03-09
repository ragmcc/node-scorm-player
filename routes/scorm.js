var express = require('express');
var router = express.Router();

var path = require('path');
var fs = require('fs');
var parseString = require('xml2js').parseString;

/* GET home page. */
router.get('/view/sco/*', function(req, res, next) {
    var url = req.url.split('/view/sco/')[1];
    url = url.split('?')[0];

    var file = path.resolve(__dirname + '/../scorm/packages/' + url);

    console.log("Loading scorm file: " + file);

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

/* GET home page. */
router.get('/view/:id', function(req, res, next) {
    var id = (req.params.id == undefined ? false : req.params.id);

    var imsmanifestPath = __dirname + '/../scorm/packages/' + id + '/imsmanifest.xml';
    if (fs.existsSync(imsmanifestPath)) {
        var imsmanifest = fs.readFileSync(imsmanifestPath);

        parseString(imsmanifest, function (err, result) {
            if( !err ) {
                imsmanifest = result.manifest;
                res.render('scorm', {
                    title: 'Scorm - Player',
                    id: id,
                    imsmanifest: JSON.stringify(imsmanifest)
                });

                /*
                 res.json({
                 'success': true,
                 'data': imsmanifest
                 });
                 */
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

module.exports = router;