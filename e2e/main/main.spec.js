'use strict';

describe('Main View', function () {
  var page;

  beforeEach(function () {
    browser.get('/');
    page = require('./main.po');
  });

  it('should include title, brand and heading with correct app name', function () {
    var appName = 'Group Voice Biometrics';
    expect(browser.getTitle()).toEqual(appName);
    expect(page.brand).toBeDefined();
    expect(page.brand.getText()).toBe(appName);
    expect(page.jumbotron).toBeDefined();
    expect(page.h1El).toBeDefined();
    expect(page.h1El.getText()).toBe(appName);
  });

  it('should contain a menu with Home, Enroll, Authenticate', function () {
    expect(page.menu).toBeDefined();
    page.menu.then(function (elements) {
      expect(elements.length).toEqual(3);
      expect(elements[0].getText()).toEqual('Home');
      expect(elements[1].getText()).toEqual('Enroll');
      expect(elements[2].getText()).toEqual('Authenticate');
    });
  });

  it('should contain two panels for Enrollment and Authentication', function () {
    page.panelHeadings.then(function (elements) {
      expect(elements.length).toEqual(2);
      expect(elements[0].getText()).toEqual('Enrollment');
      expect(elements[1].getText()).toEqual('Authentication');
    });
  });

  it('should contain two buttons for Enrollment and Authentication', function () {
    expect(page.enrollButton).toBeDefined();
    expect(page.authenticateButton).toBeDefined();
  });

  it('should go to the Enrollment page when the Enrollment button is clicked', function () {
    page.enrollButton.click();
    expect(browser.getCurrentUrl()).toContain('/enroll');
  });

  it('should go to the Authentication page when the Authentication button is clicked', function () {
    page.authenticateButton.click();
    expect(browser.getCurrentUrl()).toContain('/authenticate');
  });

});
