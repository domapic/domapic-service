'use strict'

const { kebabCase } = require('lodash')

// Services
const ABILITIES = 'abilities'
const STATE_HANDLER_PATH = 'state'
const ACTION_HANDLER_PATH = 'action'
const EVENT_HANDLER_PATH = 'event'

// Controller
const SERVICES = 'services'

const normalizeName = name => kebabCase(name)

const resolveUri = function () {
  return Array.prototype.slice.call(arguments).join('/')
}

// Services
const abilityStateHandler = name => resolveUri(ABILITIES, normalizeName(name), STATE_HANDLER_PATH)
const abilityActionHandler = name => resolveUri(ABILITIES, normalizeName(name), ACTION_HANDLER_PATH)

// Controller
const services = () => SERVICES
const abilityEventHandler = id => resolveUri(ABILITIES, id, EVENT_HANDLER_PATH)

module.exports = {
  // Services
  abilityStateHandler,
  abilityActionHandler,
  // Controller
  abilityEventHandler,
  services
}

/* 'use strict'

const _ = require('lodash')
 const SERVICES_URL = 'services'
const COMMANDS_URL = 'commands'
const ACTIONS_URL = 'actions'
const STATES_URL = 'states'
const EVENTS_URL = 'events'
const ABILITIES_URL = 'abilities'
 const AUTH_URL = 'auth'
 const API_KEY_URL = 'apikey'

 const serviceType = function (packageName) {
   if (/-service$/.test(packageName)) {
     return 'service'
   } else if (/-controller$/.test(packageName)) {
     return 'controller'
   } else if (/-plugin$/.test(packageName)) {
     return 'plugin'
   }
   return 'unrecognized'
 }

 const normalizeName = function (name) {
   return _.kebabCase(name)
 }

 const resolveUrl = function () {
   return Array.prototype.slice.call(arguments).join('/')
 }

 const authUrl = function () {
   return AUTH_URL
 }

 const authApiKeyUrl = function () {
   return resolveUrl(authUrl(), API_KEY_URL)
 }

 const abilitiesUrl = function () {
   return ABILITIES_URL
 }

 const abilityUrl = function (id) {
   return resolveUrl(abilitiesUrl(), id)
 }

 const servicesUrl = function () {
   return SERVICES_URL
 }

 const serviceUrl = function (name) {
   return resolveUrl(servicesUrl(), normalizeName(name))
 }

 const serviceEventUrl = function (serviceName, eventName) {
   return resolveUrl(serviceUrl(serviceName), eventUrl(eventName))
 }

 const serviceAbilitiesUrl = function (serviceName) {
  return resolveUrl(serviceUrl(serviceName), ABILITIES_URL)
}
 const commandUrl = function (name) {
  return resolveUrl(COMMANDS_URL, normalizeName(name))
const actionUrl = function (name) {
  return resolveUrl(ACTIONS_URL, normalizeName(name))
}
 const stateUrl = function (name) {
   return resolveUrl(STATES_URL, normalizeName(name))
 }

 const eventUrl = function (name) {
   return resolveUrl(EVENTS_URL, normalizeName(name))
 }

 module.exports = {
   serviceType: serviceType,
   normalizeName: normalizeName,
   authApiKeyUrl: authApiKeyUrl,
   abilitiesUrl: abilitiesUrl,
   abilityUrl: abilityUrl,
   servicesUrl: servicesUrl,
  serviceUrl: serviceUrl,
  serviceEventUrl: serviceEventUrl,
  serviceAbilitiesUrl: serviceAbilitiesUrl,
  commandUrl: commandUrl,
  actionUrl: actionUrl,
  eventUrl: eventUrl,
  stateUrl: stateUrl
}
*/
