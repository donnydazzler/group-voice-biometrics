/**
 * This file uses the Page Object pattern to define the main page for tests
 * https://docs.google.com/presentation/d/1B6manhG0zEXkC-H-tPo2vwU06JhL8w9-XCF9oehXzAQ
 */

'use strict';

var MainPage = function () {
  this.brand = element(by.css('.navbar-brand'));
  this.menu = element.all(by.repeater('item in menu'));
  this.jumbotron = element(by.css('.jumbotron'));
  this.h1El = element(by.css('h1'));
  this.panelHeadings = element.all(by.css('h3'));
  this.enrollButton = element(by.id('enrollButton'));
  this.authenticateButton = element(by.id('authenticateButton'));
};

module.exports = new MainPage();
