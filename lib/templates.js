'use strict'

const microService = require('domapic-microservice')

const templates = {
  apiKeyAlreadyExists: 'ApiKey reference "{{reference}}" already exists',
  apiKeyUserNotAllowed: 'User not allowed to manage api keys',
  controllerApiKey: 'Use the next Api Key in Controller to allow connection with this service:\n\n{{key}}\n',

  addingAbility: 'Adding service {{type}}',
  addingConnectionApi: 'Adding connection api',
  addingSecurityApi: 'Adding security api',

  connecting: 'Trying to connect with Domapic Controller',
  noControllerConfigured: 'No controller url was found in configuration. Use the --controller option to define it',
  noControllerApiKeyConfigured: 'No controller api key was defined. Use the --controllerApiKey option to define it',
  errorConnecting: 'Error connecting to Controller:',
  registeringService: 'Adding service to Controller',
  serviceNameAlreadyDefined: 'The service name is already defined in Controller with different id',
  notConnected: 'The service is not connected to Controller',
  connected: 'Connection success with Domapic Controller at {{controller}}',
  noServiceNameConfigured: 'No service name found',
  controllerAuthError: 'Unauthorized to connect to controller. Please review the --controllerApiKey option'
}

module.exports = {
  compiled: microService.utils.templates.compile(templates),
  core: microService.utils.templates
}
