'use strict';

var audioHandler = require('../../components/audioHandler');

/**
 * Authenticates a user and looks up their record in the DB.
 * The request body must contain the WAV data.
 * POST to http://localhost:9000/api/authentications
 */
exports.create = function (req, res) {
  audioHandler(req, res, 'authenticate');
};
