'use strict';

var audioHandler = require('../../components/audioHandler');

/**
 * Creates or updates an enrollment record in the DB.
 * The request must include a `firstname` query parameter and the request body must be WAV data.
 * POST to http://localhost:9000/api/enrollments
 */
exports.create = function (req, res) {
  audioHandler(req, res, 'enroll');
};
