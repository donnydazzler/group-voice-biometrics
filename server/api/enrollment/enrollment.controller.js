'use strict';

var _ = require('lodash');
var Enrollment = require('./enrollment.model');

// Get list of enrollments
exports.index = function(req, res) {
  Enrollment.find(function (err, enrollments) {
    if(err) { return handleError(res, err); }
    return res.json(200, enrollments);
  });
};

// Get a single enrollment
exports.show = function(req, res) {
  Enrollment.findById(req.params.id, function (err, enrollment) {
    if(err) { return handleError(res, err); }
    if(!enrollment) { return res.send(404); }
    return res.json(enrollment);
  });
};

// Creates a new enrollment in the DB.
exports.create = function(req, res) {
  Enrollment.create(req.body, function(err, enrollment) {
    if(err) { return handleError(res, err); }
    return res.json(201, enrollment);
  });
};

// Updates an existing enrollment in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Enrollment.findById(req.params.id, function (err, enrollment) {
    if (err) { return handleError(res, err); }
    if(!enrollment) { return res.send(404); }
    var updated = _.merge(enrollment, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, enrollment);
    });
  });
};

// Deletes a enrollment from the DB.
exports.destroy = function(req, res) {
  Enrollment.findById(req.params.id, function (err, enrollment) {
    if(err) { return handleError(res, err); }
    if(!enrollment) { return res.send(404); }
    enrollment.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}