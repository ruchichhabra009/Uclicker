var express = require('express');
var app = express();
var http = require('http').createServer(app);
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var logger = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var db = require('./db');
require('./config/passport')(passport);

http.listen(3000);
var io = require('socket.io').listen(http);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(session({
    secret: 'uclickersecret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    }, //30 days
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        url: 'mongodb://kunalkhona:uclicker@ds051740.mongolab.com:51740/users'
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride());
require('./routes/index.js')(app, passport, io);


app.use(express.static(path.join(__dirname, 'public')));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

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


module.exports = app;
