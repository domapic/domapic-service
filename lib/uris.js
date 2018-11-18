'use strict'

const querystring = require('querystring')

const { kebabCase, omitBy, isUndefined } = require('lodash')

// modules
const ABILITIES = 'abilities'
const STATE_HANDLER_PATH = 'state'
const ACTION_HANDLER_PATH = 'action'
const EVENT_HANDLER_PATH = 'event'

// Controller
const AUTH = 'auth'
const SERVICES = 'services'
const USERS = 'users'
const LOGS = 'logs'

const normalizeName = name => kebabCase(name)

const resolveUri = function () {
  return Array.prototype.slice.call(arguments).join('/')
}

// modules
const abilityStateHandler = name => resolveUri(ABILITIES, normalizeName(name), STATE_HANDLER_PATH)
const abilityActionHandler = name => resolveUri(ABILITIES, normalizeName(name), ACTION_HANDLER_PATH)

// Controller
const authTokens = () => resolveUri(AUTH, 'tokens')
const authApiKey = () => resolveUri(AUTH, 'apiKey')

const services = () => SERVICES
const serviceUri = id => resolveUri(SERVICES, id)

const abilities = () => ABILITIES
const ability = id => resolveUri(ABILITIES, id)
const abilityEvent = id => resolveUri(ABILITIES, id, EVENT_HANDLER_PATH)
const abilityState = id => resolveUri(ABILITIES, id, STATE_HANDLER_PATH)
const abilityAction = id => resolveUri(ABILITIES, id, ACTION_HANDLER_PATH)

const users = () => USERS
const usersMe = () => resolveUri(USERS, 'me')
const user = id => resolveUri(USERS, id)

const getLogs = () => LOGS

// Helpers
const query = (baseUri, queryParams) => `${baseUri}?${querystring.stringify(omitBy(queryParams, isUndefined))}`

module.exports = {
  // modules
  abilityStateHandler,
  abilityActionHandler,
  // Controller
  authTokens,
  authApiKey,
  services,
  service: serviceUri,
  abilities,
  ability,
  abilityEvent,
  abilityState,
  abilityAction,
  users,
  user,
  usersMe,
  getLogs,
  // Helpers
  query
}
