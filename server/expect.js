var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chaiAsPromised.transferPromiseness = function (assertion, promise) {
  assertion.then = promise.then.bind(promise); // this is all you get by default
  assertion.finally = promise.finally.bind(promise);
  assertion.done = promise.done.bind(promise);
};

chai.should();  // to enable promise should methods
chai.use(chaiAsPromised);

module.exports = chai.expect;


