'use strict';

var _ = require('lodash');
var Authentication = require('./authentication.model');

// Get list of authentications
exports.index = function(req, res) {
  Authentication.find(function (err, authentications) {
    if(err) { return handleError(res, err); }
    return res.json(200, authentications);
  });
};

// Get a single authentication
exports.show = function(req, res) {
  Authentication.findById(req.params.id, function (err, authentication) {
    if(err) { return handleError(res, err); }
    if(!authentication) { return res.send(404); }
    return res.json(authentication);
  });
};

// Creates a new authentication in the DB.
exports.create = function(req, res) {
  Authentication.create(req.body, function(err, authentication) {
    if(err) { return handleError(res, err); }
    return res.json(201, authentication);
  });
};

// Updates an existing authentication in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Authentication.findById(req.params.id, function (err, authentication) {
    if (err) { return handleError(res, err); }
    if(!authentication) { return res.send(404); }
    var updated = _.merge(authentication, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, authentication);
    });
  });
};

// Deletes a authentication from the DB.
exports.destroy = function(req, res) {
  Authentication.findById(req.params.id, function (err, authentication) {
    if(err) { return handleError(res, err); }
    if(!authentication) { return res.send(404); }
    authentication.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}