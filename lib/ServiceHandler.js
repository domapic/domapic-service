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

  const getControllerData = function () {
    return service.config.get()
      .then((config) => {
        return Promise.resolve({
          controller: config.controller,
          controllerApiKey: config.controllerApiKey
        })
      })
  }

  const logApiKey = function () {
    return security.getApiKeyForController()
      .then((apiKey) => {
        return service.tracer.warn(templates.compiled.controllerApiKey({
          key: apiKey
        }))
      })
  }

  const connect = function () {
    return getControllerData()
      .then((controllerData) => {
        return connection.connect(controllerData)
      })
      .catch(() => {
        return logApiKey()
      })
  }

  const start = function () {
    return service.server.start()
      .then(connect)
  }

  const publicMethods = _.extend({
    tracer: service.tracer,
    start: start,
    register: abilities.register
  }, events)

  return {
    addConnectionApi: connection.addApi,
    addSecurityApi: security.addApi,
    addSecurity: security.addApiKeyAuth,
    publicMethods: publicMethods
  }
}

module.exports = ServiceHandler
