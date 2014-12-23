/**
 * Shared handler for audio requests
 */

'use strict';

var VoiceIt = require('voice-it'),
  Enrollment = require('../../api/enrollment/enrollment.model'),
  config = require('../../config/config');

function processEnrollment(enrollmentId, detectedTextConfidence, firstName) {
  // Check enrollment speech to text confidence
  if (detectedTextConfidence > config.voiceprintTextConfidenceThreshold) {

    // write enrollmentId and first name to db
    var enrollment = {enrollmentId: [enrollmentId], firstName: firstName};

    Enrollment.findOneAndUpdate({firstName: firstName}, {$push: {enrollmentId: enrollmentId}}, {upsert: true}, function (err, returnedEnrollment) {
      if (err) {
        console.log('error during enrollment upsert:', err);
        return res.status(400).json({result: 'enrollment failed'});
      }
      console.log('Wrote ' + JSON.stringify(enrollment) + ' to db');
      return res.status(200).json({
        result: 'success',
        firstName: firstName,
        enrollments: returnedEnrollment.enrollmentId.length
      });
    });
  } else {
    console.log('Detected text confidence too low:', detectedTextConfidence);
    return res.status(400).json({result: 'Speech to text confidence too low, please try again.'});
  }
}

function processAuthentication(enrollmentId) {
  // lookup user in db
  Enrollment.findOne({enrollmentId: enrollmentId}, 'firstName enrollmentId')
    .exec(function (err, user) {
      if (err) {
        console.log('error during authentication findOne:', err);
        return res.status(400).json({result: 'authentication failed'});
      }
      if (!user) {
        console.log('no match found for EnrollmentID ' + enrollmentId + ' in db');
        return res.status(400).json({result: 'authentication failed'});
      }
      return res.status(200).json({
        result: 'success',
        firstName: user.firstName
      });
    });
}

module.exports = function handleAudio(req, res, action) {
  var dataView,
    enrollmentId,
    detectedVoiceprintText,
    detectedTextConfidence,
    firstName,
    enrollment,
    promise;

  dataView = req.body;
  firstName = req.query && req.query.firstName;

  if (dataView) {
    var voiceIt = new VoiceIt({
      developerId: config.VOICEIT_DEV_ID
    });

    config.wav = dataView;

    if (action === 'enroll') {
      promise = voiceIt.enrollments.create(config);
    }
    if (action === 'authenticate') {
      promise = voiceIt.authentications.authentication(config);
    }

    promise.then(function (body) {
      console.log('voiceIt response body:', body);

      enrollmentId = body.EnrollmentID;
      detectedVoiceprintText = body.DetectedVoiceprintText;
      detectedTextConfidence = body.DetectedTextConfidence;

      if (enrollmentId) {
        if (action === 'enroll') {
          processEnrollment(enrollmentId, detectedTextConfidence, firstName);
        }
        if (action === 'authenticate') {
          processAuthentication(enrollmentId);
        }
      } else {
        console.log('No enrollment ID returned from VoiceIt');
        return res.status(400).json({result: 'No enrollment ID returned from VoiceIt'});
      }
    }, function (err) {
      console.log('error calling VoiceIt:', err);
      return res.status(400).json({result: 'error calling VoiceIt: ' + err});
    });
  } else {
    console.log('No audio data in request body');
    return res.status(400).json({result: 'No audio data in request body'});
  }
};
