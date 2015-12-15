var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local: {
        fname: String,
        lname: String,
        email: String,
        password: String,
        activated: Number
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.plugin(require('mongoose-role'), {

    roles: ['admin', 'professor', 'student'],
    accessLevels: {
        'createProf': ['admin'],
        'createPolls': ['admin', 'professor'],
        'vote': ['admin', 'professor', 'student']
    }
});
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
