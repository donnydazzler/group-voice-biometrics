'use strict';

describe('Controller: AuthenticateCtrl', function () {

  // load the controller's module
  beforeEach(module('groupVoiceBiometricsApp'));

  var AuthenticateCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AuthenticateCtrl = $controller('AuthenticateCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
