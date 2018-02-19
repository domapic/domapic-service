'use strict'

const Promise = require('bluebird')

const templates = require('./templates')

const Client = function (service, connectionInfo) {
  let client = new service.client.Connection(connectionInfo.controller)

  // TODO, auth in requests

  // TODO, add abilities function

  const setConnectedState = function () {
    // TODO, set connection state to true
  }

  const addService = function () {
    // TODO, add service to controller API.
    return client.post('/services' + connectionInfo.serviceName)
      .then(setConnectedState)
  }

  const ensureServiceIsRegistered = function (connectionInfo) {
    return client.get('/services/' + connectionInfo.serviceName)
      .then((response) => {
        if (response.id !== connectionInfo.serviceId) {
          return Promise.reject(new service.errors.Conflict(templates.compiled.serviceNameAlreadyDefined()))
        } else {
          return setConnectedState()
        }
      })
      .catch(service.errors.NotFound, () => {
        return addService()
      })
  }

  const registerService = function () {
    return ensureServiceIsRegistered()
  }

  return {
    registerService: registerService
  }
}

module.exports = Client
