'use strict';

angular.module('groupVoiceBiometricsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('enroll', {
        url: '/enroll',
        templateUrl: 'app/enroll/enroll.html',
        controller: 'EnrollCtrl'
      });
  });