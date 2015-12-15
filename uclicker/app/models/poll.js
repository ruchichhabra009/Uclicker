var mongoose = require('mongoose');

var choiceSchema = new mongoose.Schema({
    ctext: String,
    votes: [String]
});

var pSchema = new mongoose.Schema({
    question: String,
    glink: String,
    choices: [choiceSchema]
});

exports.PollSchema = new mongoose.Schema({
    course: String,
    polls: [pSchema]

});
