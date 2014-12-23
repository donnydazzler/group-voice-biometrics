'use strict';

/*
 The initAudio() and gotStream() functions are based on Chris Wilson's AudioRecorder demo: https://webaudiodemos.appspot.com/AudioRecorder/
 */
angular.module('groupVoiceBiometricsApp')
  .service('audioService', ['$http', '$q', function ($http, $q) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var audioRecorder = null,
      action = null,
      firstName = null;

    /** Handles cross-browser getUserMedia step & sets audio constraints */
    function initAudio() {
      navigator.getUserMedia = ( navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);

      if (navigator.getUserMedia) {
        navigator.getUserMedia({
          'audio': {
            'mandatory': {
              'googEchoCancellation': 'false',
              'googAutoGainControl': 'false',
              'googNoiseSuppression': 'false',
              'googHighpassFilter': 'false'
            },
            'optional': []
          }
        }, gotStream, function (err) {
          console.log('Error getting user media:', err);
        });
      }
    }

    /** Connect the Web Audio API nodes together */
    function gotStream(stream) {
      var audioInput,
        realAudioInput,
        inputPoint,
        audioContext;

      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new window.AudioContext();

      inputPoint = audioContext.createGain();

      // Create AudioNode from stream
      realAudioInput = audioContext.createMediaStreamSource(stream);
      audioInput = realAudioInput;
      audioInput.connect(inputPoint);

      audioRecorder = new window.Recorder(inputPoint);

      var zeroGain = audioContext.createGain();
      zeroGain.gain.value = 0.0;
      inputPoint.connect(zeroGain);
      zeroGain.connect(audioContext.destination);
    }

    function sendAudio() {
      var deferred = $q.defer(), url;
      audioRecorder.getBuffer(function () {
        // exportWAV() interleaves the left and right channels (typed arrays), encodes and returns a DataView.
        // The wav is in little-endian format (least significant byte is first; the most common CPU architecture).
        audioRecorder.exportWAV(function (dataView) {
          // POST wav data to server-side
          url = (action === 'authenticate') ? '/api/authentications' : '/api/enrollments';
          $.ajax({
            url: url + '?firstName=' + firstName,
            type: 'POST',
            contentType: 'audio/wav',
            data: dataView,
            processData: false
          }).success(function (data) {
            //console.log('Response from server:', data);
            deferred.resolve(data);
          }).error(function (jqXHR, textStatus, errorThrown) {
            //console.log('textStatus:', textStatus);
            //console.log('errorThrown:', errorThrown);
            deferred.reject(errorThrown);
          });
        });
      });
      return deferred.promise;
    }

    this.startRecording = function (theAction, theFirstName, callback) {
      if (!audioRecorder) {
        callback('audioRecorder is not set');
        return;
      }
      action = theAction;
      firstName = theFirstName;
      audioRecorder.clear();
      audioRecorder.record();
      console.log('now recording, action:', action);
    };

    this.stopRecording = function (callback) {
      if (!audioRecorder) {
        callback('audioRecorder is not set');
        return;
      }
      audioRecorder.stop();
      console.log('stopped recording, action:', action);

      var promise = sendAudio();
      promise.then(function (result) {
        if (result) {
          result.action = action;
          callback(null, result);
        } else {
          callback('no result returned from server');
        }
      }, function (err) {
        callback(err);
      });
    };

    this.setAudioRecorder = function (theAudioRecorder) {
      audioRecorder = theAudioRecorder;
    };

    initAudio();
  }]);
