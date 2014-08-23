angular.module('util')

.factory('localStorageService', [
  function localStorageServiceFactory() {
    var service = {};

    service.set = function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    };

    service.get = function(key) {
      return JSON.parse(localStorage.getItem(key));
    };

    service.remove = function(key) {
      return localStorage.removeItem(key);
    };

    return service;
  }
]);
