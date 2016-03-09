var routes = {};

routes.load = function (app, db) {

    // Include all routes
    var index = require('./index');

    var scorm = require('./scorm');

    // Load all routes
    app.use(function(req,res,next){
        req.db = db;

        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Mx-ReqToken,X-Requested-With');

        next();
    });

    app.use('/', index);

    app.use('/scorm', scorm);

    // Catch 404 and forward to error handler
    app.use(function(req, res, next) {
        res.status(404);
        res.render('error', {
            message: 'File not found',
            error: {
                'status': '404'
            }
        });
    });
};

module.exports = routes;