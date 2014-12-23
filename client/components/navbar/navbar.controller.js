'use strict';

angular.module('groupVoiceBiometricsApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }, {
      'title': 'Enroll',
      'link': '/enroll'
    }, {
      'title': 'Authenticate',
      'link': '/authenticate'
    }];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });