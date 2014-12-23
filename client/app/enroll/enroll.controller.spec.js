'use strict';

describe('Controller: EnrollCtrl', function () {

  // load the controller's module
  beforeEach(module('groupVoiceBiometricsApp'));

  var EnrollCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EnrollCtrl = $controller('EnrollCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
