'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var EnrollmentSchema = new Schema({
  firstName: {type: String, index: true},
  enrollmentId: [Number]
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
