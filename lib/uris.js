'use strict'

const querystring = require('querystring')

const { kebabCase, omitBy, isUndefined } = require('lodash')

// Services
const ABILITIES = 'abilities'
const STATE_HANDLER_PATH = 'state'
const ACTION_HANDLER_PATH = 'action'
const EVENT_HANDLER_PATH = 'event'

// Controller
const AUTH = 'auth'
const SERVICES = 'services'
const USERS = 'users'

const normalizeName = name => kebabCase(name)

const resolveUri = function () {
  return Array.prototype.slice.call(arguments).join('/')
}

// Services
const abilityStateHandler = name => resolveUri(ABILITIES, normalizeName(name), STATE_HANDLER_PATH)
const abilityActionHandler = name => resolveUri(ABILITIES, normalizeName(name), ACTION_HANDLER_PATH)

// Controller
const authTokens = () => resolveUri(AUTH, 'tokens')
const authApiKey = () => resolveUri(AUTH, 'apiKey')

const services = () => SERVICES
const service = id => resolveUri(SERVICES, id)

const abilities = () => ABILITIES
const ability = id => resolveUri(ABILITIES, id)
const abilityEventHandler = id => resolveUri(ABILITIES, id, EVENT_HANDLER_PATH)

const users = () => USERS
const usersMe = () => resolveUri(USERS, 'me')

// Helpers
const query = (baseUri, queryParams) => resolveUri(baseUri, `?${querystring.stringify(omitBy(queryParams, isUndefined))}`)

module.exports = {
  // Services
  abilityStateHandler,
  abilityActionHandler,
  // Controller
  authTokens,
  authApiKey,
  services,
  service,
  abilities,
  ability,
  abilityEventHandler,
  users,
  usersMe,
  // Helpers
  query
}
