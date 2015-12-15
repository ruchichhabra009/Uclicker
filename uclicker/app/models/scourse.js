var mongoose = require('mongoose');

var scoursechoiceSchema = new mongoose.Schema({
    ctext: String,
});
exports.SCourseSchema = new mongoose.Schema({
    student: String,
    scourses: [scoursechoiceSchema]
});
