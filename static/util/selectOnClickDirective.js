angular.module('util.selectOnClickDirective', [])

.directive('selectOnClick', function() {
  return {
    restrict: 'A',
    controller: function($scope, $element) {
      $element.bind('click', function() {
        var item = this;
        setTimeout(function() {
          item.selectionStart = 0;
          item.selectionEnd = item.value.length;
        }, 2);
      });
    }
  };
});
