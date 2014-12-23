'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/enrollments', function () {

  it('should respond with an error when no audio data passed in body', function (done) {
    request(app)
      .post('/api/enrollments')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        res.body.should.have.property('result', 'error calling VoiceIt: TypeError: first argument must be a string or Buffer');
        done();
      });
  });

});
