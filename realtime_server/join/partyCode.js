var possible = "ACEFGHIJKLMNOPQRSTUVWXYZ";
var numPossible = possible.length;
var codeLength = 6;

module.exports = function partyCode() {
  var result = "";
  for (var i = 0; i < codeLength; i++) {
    result += possible.charAt(Math.floor(Math.random()*numPossible));
  }
  return result;
}
