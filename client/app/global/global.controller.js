'use strict';

angular.module('groupVoiceBiometricsApp')
  .controller('GlobalCtrl', ['$scope', '$timeout', 'audioService', function ($scope, $timeout, audioService) {

    $scope.enrollNumber = 0;

    function resetUI() {
      $scope.status = null;
      $scope.counter = 5;
      $scope.recording = false;
    }

    function processAudio() {
      audioService.stopRecording(function (err, result) {
        // handle audioService response
        if (err) {
          console.log('error with audio request:', err);
          $scope.status = 'Oops, there was an error!';
          return;
        }

        if (result.action === 'enroll') {
          $scope.enrollNumber = result.enrollmentId.length;
          if (result.result === 'success') {
            $scope.status = 'Successful enrollment!';
            return;
          } else {
            $scope.status = 'Sorry your enrollment was unsuccessful. Please try again.';
            return;
          }
        }

        if (result.action === 'authenticate') {
          if (result.result === 'success') {
            $scope.status = 'Hi ' + result.firstName + '!';
          } else {
            $scope.status = 'Sorry we were unable to authenticate you. Please try again.';
          }
        }
      });
    }

    function countdown() {
      if ($scope.counter > 1) {
        $scope.counter--;
        $timeout(countdown, 1000);
      }
    }

    $scope.startRecording = function (action) {
      if ($scope.recording) {
        // force timer to stop
        $scope.recording = false;
        $scope.counter = 0;
        return;
      }
      if (action === 'enroll' && !$scope.firstName) {
        $scope.status = 'Please enter your first name!';
        return;
      }
      $scope.counter = 5;
      $scope.status = 'Recording...';

      // start countdown
      var promise = $timeout(countdown, 1000);
      promise.then(function () {
        resetUI();
        processAudio();
      });

      // start recording
      audioService.startRecording(action, $scope.firstName, function (err) {
        if (err) {
          $scope.status = 'Please reload the page and enable your microphone!';
          $timeout.cancel(promise);
        }
      });
    };

    resetUI();
  }]);
