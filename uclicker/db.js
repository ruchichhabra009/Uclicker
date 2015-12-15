var mongoose = require('mongoose');

mongoose.connect('mongodb://kunalkhona:uclicker@ds051740.mongolab.com:51740/users');

module.exports = mongoose.connection;
