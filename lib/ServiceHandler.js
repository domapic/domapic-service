'use strict'

const _ = require('lodash')
const Promise = require('bluebird')

const Abilities = require('./Abilities')
const Connection = require('./Connection')
const Security = require('./Security')
const events = require('./events')
const templates = require('./templates')

const ServiceHandler = function (service) {
  const security = new Security(service)
  const connection = new Connection(service, security)
  const abilities = new Abilities(service, connection)
  let started = false

  const getControllerData = function () {
    return service.config.get()
      .then((config) => {
        return Promise.resolve({
          controller: config.controller,
          controllerApiKey: config.controllerApiKey
        })
      })
  }

  const connect = function () {
    return getControllerData()
      .then((controllerData) => {
        return connection.connect(controllerData)
      })
      .catch(() => {
        return Promise.resolve()
      })
  }

  const start = function () {
    started = true
    return service.server.start()
      .then(connect)
  }

  const register = function (abilitiesDefinitions) {
    if (started === false) {
      return abilities.register(abilitiesDefinitions)
    }
    return Promise.reject(service.errors.BadImplementation(templates.compiled.registerAbilitiesServerStarted()))
  }

  const publicMethods = _.extend({
    tracer: service.tracer,
    start: start,
    register: register
  }, events)

  return {
    addConnectionApi: connection.addApi,
    addSecurityApi: security.addApi,
    addSecurity: security.addApiKeyAuth,
    publicMethods: publicMethods
  }
}

module.exports = ServiceHandler
