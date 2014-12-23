'use strict';

angular.module('groupVoiceBiometricsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('authenticate', {
        url: '/authenticate',
        templateUrl: 'app/authenticate/authenticate.html',
        controller: 'AuthenticateCtrl'
      });
  });