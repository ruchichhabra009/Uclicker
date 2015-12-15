var mongoose = require('mongoose');

var coursechoiceSchema = new mongoose.Schema({
    ctext: String,
});
exports.CourseSchema = new mongoose.Schema({

    professor: String,
    courses: [coursechoiceSchema]

});
