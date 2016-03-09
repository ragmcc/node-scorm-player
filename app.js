var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


/*********/
/** App **/
/*********/

var app = express();
var server = require('http').Server(app);

app.server = server;

/*****************/
/** View engine **/
/*****************/

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/*************/
/** MongoDB **/
/*************/

/*var mongo = require('mongodb');
var monk = require('monk');
var db = monk('', {
  username : '',
  password : ''
});*/
db = null;


/***************/
/** Socket.io **/
/***************/

var io = require('socket.io')(server);

var sockets = require('./sockets/sockets').load(io);


/************/
/** Routes **/
/************/

var routes = require('./routes/routes').load(app, db);


/************/
/** Errors **/
/************/

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Export APP
module.exports = app;