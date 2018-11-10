'use strict'

const domapic = require('domapic-base')

const API_KEY_SEP = '-----------------------------------------------------------------'

const templates = {
  apiKeyAlreadyExists: 'ApiKey reference "{{reference}}" already exists',
  apiKeyDoesNotExist: 'ApiKey "{{apiKey}}" does not exist',
  apiKeyUserNotAllowed: 'User not allowed to manage api keys',
  controllerApiKey: `\n${API_KEY_SEP}\nTry adding connection from Controller, using the next service Api Key: {{key}}\n${API_KEY_SEP}`,

  addingAbility: 'Adding service {{type}}',
  abilityNameAlreadyExists: 'Ability "{{name}}" is already registered',
  addingConnectionApi: 'Adding connection api',
  addingSecurityApi: 'Adding security api',
  registerAbilitiesServerStarted: 'Registering abilities once the server is started is not allowed',
  abilityValidationError: 'Ability "{{name}}" has an invalid format: {{{message}}}',
  abilityHasNoData: 'Ability "{{name}}" has not mandatory "data" property defined',
  actionRequestBodyDescription: 'Data for the action "{{name}}"',
  stateResponseDescription: 'Current state of ability "{{name}}"',
  actionTagDescription: 'Service action',
  stateTagDescription: 'Service state',
  invalidAbilityData: 'Invalid data in {{type}} "{{name}}": {{{message}}}',
  abilityHasNothingToRegister: 'Must have at least an state, action or event to be registered',
  sendEventError: 'Error sending "{{name}}" event: {{message}}',

  noServiceNameConfigured: 'No service name found',
  connecting: 'Trying to connect with Domapic Controller',
  noControllerConfigured: 'No controller url was found in configuration. Use the --controller option to define it',
  noControllerFoundInStorage: 'No controller data was found in storage.',
  noControllerApiKeyConfigured: 'No controller api key was defined. Use the --controllerApiKey option to define it',
  errorConnecting: 'Error connecting to Controller:',
  notConnected: 'The service is not connected to Controller',
  connected: 'Connection success with Domapic Controller at {{url}}',

  gettingRegisteredAbilities: 'Getting registered abilities from controller',
  checkingRemoteAbilities: 'Checking remote abilities correspondence',
  creatingAbility: 'Creating ability "{{name}}" in controller',
  updatingAbility: 'Updating ability "{{name}}" in controller',
  deletingAbility: 'Deleting ability "{{name}}" in controller',
  registerAbilitiesIntoConnectionError: 'Error registering abilities into controller',
  registeringService: 'Adding service to Controller',
  updatingServiceInfo: 'Updating service info into Controller',
  serviceNameAlreadyDefined: 'The service name is already defined in Controller with different id',
  serviceUserAlreadyDefined: 'The service user name is already defined in Controller with different id',
  controllerAuthError: 'Unauthorized to connect to controller. Please review the --controllerApiKey option',
  checkingControllerRegisteredService: 'Checking if service is already registered into controller',
  serviceAlreadyRegistered: 'Service is already registered in controller with id "{{_id}}"',
  serviceUserAlreadyRegistered: 'Service user is already registered in controller with id "{{_id}}"',
  currentLoggedUserIsService: 'Currently logged as "{{role}}" in controller',
  currentLoggedUserIsServiceRegisterer: 'Currently logged as "service-registerer" in controller',
  registeringServiceUser: 'Adding user for this service into Controller',
  gettingUserApiKey: 'Getting service user api key from Controller',
  addingUserApiKey: 'Adding api key for service user into Controller',
  loggingIntoController: 'Loggin into controller with user id "{{_id}}" and apiKey "{{apiKey}}"',
  storingControllerData: 'Storing controller data for next connections'
}

module.exports = {
  compiled: domapic.utils.templates.compile(templates),
  core: domapic.utils.templates
}
