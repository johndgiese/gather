#!/bin/bash

for ctrl in "$@"
do
touch "Words${ctrl}Ctrl.js"
echo -e "angular.module('words')
.controller('Words${ctrl}Ctrl', [
  '\$scope', '\$stateParams',
  function(\$scope, \$stateParams) {

  }
]);" > "Words${ctrl}Ctrl.js"

html=$(echo $ctrl | sed -e 's/\(.\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
touch "../templates/${html}.html"
echo "<p>At state ${ctrl}</p>" > "../templates/${html}.html"
done
