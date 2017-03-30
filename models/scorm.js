var fs = require('fs');

var scorm = {};

var mdb = null;

function init () {
    var config = JSON.parse(fs.readFileSync(__dirname + '/../config.json'));

    var mongo = require('mongodb');
    var monk = require('monk');
    mdb = monk(config.db.host + ':' + config.db.port + '/' + config.db.name, {
        username : config.db.user,
        password : config.db.password
    });

    return mdb;
};

scorm.getOne = function(data) {
    var db = mdb === null ? init() : mdb;
    var collection = db.get('scorm_data');

    collection.findOne(
        data.query,
        data.scope,
        function (e, doc) {
            if( !e ) {
                if( doc !== null && doc._id !== null && doc._id !== undefined ) {
                    doc.id = doc._id;
                    delete doc._id;
                }

                data.success(doc);
            } else {
                data.error(e);
            }
        }
    );
};

scorm.insert = function(data) {
    var db = mdb === null ? init() : mdb;
    var collection = db.get('scorm_data');

    collection.insert(
        data.data,
        function (e, result) {
            if (!e) {
                data.success(result._id);
            } else {
                data.error(e);
            }
        }
    );
};

scorm.update = function(data) {
    var db = mdb === null ? init() : mdb;
    var collection = db.get('scorm_data');

    collection.update(
        data.query,
        {
            $set: data.set
        },
        {
            'upsert': data.upsert == true
        },
        function (e, count) {
            if (!e) {
                data.success();
            } else {
                data.error(e);
            }
        }
    );
};

module.exports = scorm;
