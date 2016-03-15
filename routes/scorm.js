var express = require('express');
var router = express.Router();

var ObjectID = require('mongodb').ObjectID;
var path = require('path');
var fs = require('fs');
var parseString = require('xml2js').parseString;
var multiparty = require('multiparty');
var unzip = require('unzip2');
var uuid = require('node-uuid');

var common = require('../classes/common');

var scormModel = require('../models/scorm');

/* GET sco resources view */
router.get('/view/sco/*', function(req, res, next) {
    var url = req.url.split('/view/sco/')[1];
    url = url.split('?')[0];

    var file = path.resolve(__dirname + '/../scorm/packages/' + url);

    console.log("Loading scorm file: " + file);

    // At this point we need to check if the file is in scorm package imsmanifest as public file.

    if (fs.existsSync(file)) {
        res.sendFile(file,
            function (err) {
                if (err) {
                    res.status(404);
                    res.render('error', {
                        message: 'File not found',
                        error: {
                            'status': '404'
                        }
                    });
                }
            }
        );
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

/*********/
/** API **/
/*********/

var user_id = 1;

router.post('/api/initialize/:sco', function(req, res, next) {
    var sco = (req.params.sco == undefined ? false : req.params.sco);

    scormModel.getOne({
        'query': {
            'sco': sco.toString(),
            'data.cmiUFF0EcoreUFF0Estudent_id': user_id
        },
        'scope': [],
        'success': function(result) {
            var data = {};
            if( result !== null && result.data !== null && result.data !== undefined ) {
                data = result.data;
            } else {
                data = {
                    'cmi.core.lesson_status': 'not attempted',
                    'cmi.core.student_id': user_id
                }
            }

            var dataTmp = {};
            for( var i in data ) {
                data[i] = {
                    'value': data[i],
                    'status': 0
                };

                dataTmp[i.toString().replace(/UFF0E/g, '.')] = data[i];
            }

            data = dataTmp;

            var session = uuid.v4();

            if( data['cmi.core.lesson_status'].value == 'not attempted' ) {
                scormModel.insert({
                    'data': {
                        'sco': sco,
                        'data': {
                            'cmiUFF0EcoreUFF0Elesson_status': 'not attempted',
                            'cmiUFF0EcoreUFF0Estudent_id': user_id
                        }
                    },
                    'success': function(id) {
                        res.json({
                            success: true,
                            data: data,
                            session: session
                        });
                    },
                    'error': function(error) {
                        res.json({
                            success: false,
                            error: error
                        });
                    }
                });
            } else {
                data = {};
                data['sessions.' + session] = {
                    'insert_at': (new Date())
                };

                scormModel.update({
                    'query': {
                        'sco': sco,
                        'data.cmiUFF0EcoreUFF0Estudent_id': user_id
                    },
                    'set': data,
                    'upsert': true,
                    'success': function() {
                        res.json({
                            success: true,
                            data: data,
                            session: session
                        });
                    },
                    'error': function() {
                        res.json({
                            success: false,
                            'error': error
                        });
                    }
                });
            }
        },
        'error': function(error) {
            res.json({
                success: false,
                'error': error
            });
        }
    });
});

router.post('/api/commit/:sco', function(req, res, next) {
    var sco = (req.params.sco == undefined ? false : req.params.sco);
    var session = (req.params.session == undefined ? false : req.params.session);
    var data = (req.body.data == undefined ? false : req.body.data);

    if( Object.keys(data).length > 0 ) {
        var dataTmp = {};
        for (var i in data) {
            dataTmp['data.' + i.toString().replace(/\./g, 'UFF0E')] = data[i].value;
        }
        data = dataTmp;

        if( data['data.cmiUFF0EcoreUFF0Esession_time'] !== null && data['data.cmiUFF0EcoreUFF0Esession_time'] !== undefined ) {
            data['sessions.' + session + '.time'] = data['data.cmiUFF0EcoreUFF0Esession_time'];
            delete data['data.cmiUFF0EcoreUFF0Esession_time'];
        }

        scormModel.update({
            'query': {
                'sco': sco,
                'data.cmiUFF0EcoreUFF0Estudent_id': user_id
            },
            'set': data,
            'upsert': false,
            'success': function() {
                res.json({
                    success: true
                });
            },
            'error': function() {
                res.json({
                    success: false,
                    error: error
                });
            }
        });
    } else {
        res.json({
            'success': true
        });
    }
});

module.exports = router;