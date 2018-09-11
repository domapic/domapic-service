'use strict'

const domapic = require('domapic-base')

const templates = {
  apiKeyAlreadyExists: 'ApiKey reference "{{reference}}" already exists',
  apiKeyDoesNotExist: 'ApiKey "{{apiKey}}" does not exist',
  apiKeyUserNotAllowed: 'User not allowed to manage api keys',
  controllerApiKey: 'Try adding connection from Controller, using the next service Api Key:\n\n{{key}}\n',

  addingAbility: 'Adding service {{type}}',
  addingConnectionApi: 'Adding connection api',
  addingSecurityApi: 'Adding security api',

  abilityNameAlreadyExists: 'Ability "{{name}}" is already registered',
  creatingAbility: 'Creating "{{type}}" of ability "{{name}}" in controller',
  updatingAbility: 'Updating "{{type}}" of ability "{{name}}" in controller',
  deprecatingAbility: 'Deprecating "{{type}}" of ability "{{name}}" in controller',
  registerAbilitiesServerStarted: 'Registering abilities once the server is started is not allowed',
  registerAbilitiesIntoConnectionError: 'Error registering abilities into controller',
  abilityValidationError: 'Ability "{{name}}" has an invalid format: {{{message}}}',
  abilityHasNoData: 'Ability "{{name}}" has not mandatory "data" property defined',
  actionRequestBodyDescription: 'Data for the action "{{name}}"',
  stateResponseDescription: 'Current state of ability "{{name}}"',
  actionTagDescription: 'Service action',
  stateTagDescription: 'Service state',
  invalidAbilityData: 'Invalid data in {{type}} "{{name}}": {{{message}}}',
  abilityHasNothingToRegister: 'Must have at least an state, action or event to be registered',
  sendEventError: 'Error sending "{{name}}" event: {{message}}',

  connecting: 'Trying to connect with Domapic Controller',
  noControllerConfigured: 'No controller url was found in configuration. Use the --controller option to define it',
  noControllerApiKeyConfigured: 'No controller api key was defined. Use the --controllerApiKey option to define it',
  errorConnecting: 'Error connecting to Controller:',
  registeringService: 'Adding service to Controller',
  updatingServiceInfo: 'Updating service info into Controller',
  serviceNameAlreadyDefined: 'The service name is already defined in Controller with different id',
  notConnected: 'The service is not connected to Controller',
  connected: 'Connection success with Domapic Controller at {{url}}',
  noServiceNameConfigured: 'No service name found',
  controllerAuthError: 'Unauthorized to connect to controller. Please review the --controllerApiKey option'
}

module.exports = {
  compiled: domapic.utils.templates.compile(templates),
  core: domapic.utils.templates
}
