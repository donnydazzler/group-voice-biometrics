'use strict';

var should = require('should'),
  audioHandler = require('./index');

describe('Audio handler component', function () {

  it('should check for audio data in request body', function () {
    var res = {
      statusCode: null,
      result: null,
      status: function (statusCode) {
        this.statusCode = statusCode;
        return this;
      }, json: function (result) {
        this.result = result;
      }
    };

    audioHandler({body: null}, res, 'test');
    res.statusCode.should.equal(400);
    res.result.should.have.property('result', 'No audio data in request body');
  });

});
