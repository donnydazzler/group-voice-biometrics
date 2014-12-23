'use strict';

describe('GlobalCtrl', function () {

  // load the controller's module
  beforeEach(module('groupVoiceBiometricsApp'));

  var GlobalCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    GlobalCtrl = $controller('GlobalCtrl', {
      $scope: scope
    });
  }));

  it('should exist', function () {
    expect(GlobalCtrl).toBeDefined();
  });

  it('should start with 0 enrollments, counter of 5, and recording set to false', function () {
    expect(scope.enrollments).toEqual(0);
    expect(scope.counter).toEqual(5);
    expect(scope.recording).toBeFalsy();
    expect(scope.status).toBeNull();
  });

  it('should set the counter to 0 if startRecording is called when already recording', function () {
    expect(scope.counter).toEqual(5);
    scope.recording = true;
    scope.startRecording('enroll');
    expect(scope.counter).toEqual(0);
    expect(scope.recording).toBeFalsy();
  });

  it('should force user to enter their first name when enrolling', function () {
    scope.firstName = null;
    scope.startRecording('enroll');
    expect(scope.status).toEqual('Please enter your first name!');
  });

  it('should prompt user to enable their microphone', function () {
    scope.startRecording('test');
    expect(scope.status).toEqual('Please reload the page and enable your microphone!');
  });

});
