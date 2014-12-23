'use strict';

describe('audioService', function () {

  // load the service's module
  beforeEach(module('groupVoiceBiometricsApp'));

  // instantiate service
  var audioService;
  beforeEach(inject(function (_audioService_) {
    audioService = _audioService_;
  }));

  it('should exist', function () {
    expect(audioService).toBeDefined();
  });

  it('should say that audioRecorder is not set in startRecording', function () {
    audioService.startRecording('test', 'test', function (err) {
      expect(err).toBe('audioRecorder is not set');
    });
  });

  it('should call audioRecorder during startRecording', function () {
    var clear = jasmine.createSpy('clear'),
      record = jasmine.createSpy('record'),
      audioRecorder = {clear: clear, record: record};

    audioService.setAudioRecorder(audioRecorder);
    audioService.startRecording('test', 'test', function (err) {
    });
    expect(clear).toHaveBeenCalled();
    expect(record).toHaveBeenCalled();
  });

  it('should say that audioRecorder is not set during stopRecording', function () {
    audioService.stopRecording(function (err) {
      expect(err).toBe('audioRecorder is not set');
    });
  });

  it('should call audioRecorder during stopRecording', function () {
    var stop = jasmine.createSpy('stop'),
      getBuffer = jasmine.createSpy('getBuffer'),
      audioRecorder = {stop: stop, getBuffer: getBuffer};

    audioService.setAudioRecorder(audioRecorder);
    audioService.stopRecording(function (err) {
    });
    expect(stop).toHaveBeenCalled();
    expect(getBuffer).toHaveBeenCalled();
  });

});
