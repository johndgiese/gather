angular.module('util')
.filter('shuffle', function() {
  return function(input) {
    return _.shuffle(input);
  };
});
