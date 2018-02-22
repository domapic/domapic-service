'use strict'

const Promise = require('bluebird')

const templates = require('./templates')

const Client = function (service, connectionInfo) {
  const state = {
    connected: false
  }

  let client = new service.client.Connection(connectionInfo.controller, {
    apiKey: connectionInfo.controllerApiKey
  })

  const setConnected = function () {
    // TODO, emit event
    state.connected = true
    return Promise.resolve()
  }

  const setDisconnected = function () {
    // TODO, emit event
    state.connected = false
    return Promise.resolve()
  }

  const addService = function () {
    return service.tracer.info(templates.compiled.registeringService())
    .then(() => {
      return client.post('/services', {
        description: connectionInfo.description,
        id: connectionInfo.serviceId,
        name: connectionInfo.serviceName,
        packageName: connectionInfo.packageName,
        version: connectionInfo.version
      })
    })
  }

  const ensureServiceIsRegistered = function () {
    return client.get('/services/' + connectionInfo.serviceName)
      .then((response) => {
        if (response.id !== connectionInfo.serviceId) {
          return Promise.reject(new service.errors.Conflict(templates.compiled.serviceNameAlreadyDefined()))
        } else {
          return Promise.resolve()
        }
      })
  }

  const registerService = function () {
    return ensureServiceIsRegistered()
      .then(setConnected)
      .catch(service.errors.NotFound, () => {
        return addService()
      })
      .catch(service.errors.Forbidden, () => {
        return Promise.reject(new service.errors.Forbidden(templates.compiled.controllerAuthError()))
      })
      .catch((err) => {
        return setDisconnected()
          .then(() => {
            return Promise.reject(err)
          })
      })
  }

  return {
    registerService: registerService,
    state: state
  }
}

module.exports = Client
