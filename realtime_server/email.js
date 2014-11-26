var config = require('./config');
var mandrill = require('mandrill-api/mandrill');
var Q = require('q');
var _ = require('underscore');


var mandrillClient = new mandrill.Mandrill(config.MANDRILL_API_KEY);


/**
 * Send a mandrill template email to one user.
 * @arg {String} - Mandrill template slug
 * @arg {String} - Subject of the email
 * @arg {Object} - Flat object of merge variables that get inserted into the template
 * @arg {String} - Email address you are sending to
 * @returns {Promise} - Return a promise for the email sending
 */
function sendTemplate(templateName, subject, mergeVars, to) {
  var deferred = Q.defer();

  function handleSucces(results) {
    var result = results[0];
    if (result.status === 'rejected') {
      deferred.reject(result.reject_reason);
    } else if (result.status === 'invalid') {
      deferred.reject(result.status);
    } else {
      deferred.resolve(result);
    }
  }

  function handleError(error) {
    deferred.reject(error);
  }

  var data = {
    template_name: templateName,
    template_content: [],
    message: {
      subject: subject,
      from_email: 'info@gather.gg',
      from_name: 'Gather',
      global_merge_vars: _.map(mergeVars, function(value, key) { return {name: key, content: value}; }),
      to: [{email: to}],
      google_analytics_domains: ['gather.gg'],
      track_opens: true,
      track_clicks: true,
    }
  };

  mandrillClient.messages.sendTemplate(data, handleSucces, handleError);
  return deferred.promise;
}


exports.sendWelcomeEmail = function(to) {
  return sendTemplate('welcome-email', 'Welcome to Gather!', {}, to);
};


exports.sendPasswordReset = function(to, resetLink) {
  return sendTemplate('password-reset', 'Password Reset for Gather', {RESET_LINK: resetLink}, to);
};

