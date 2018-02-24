'use strict'

const Promise = require('bluebird')

const templates = require('./templates')

const SERVICES_URL = '/services'

const Client = function (service, controllerData, serviceData) {
  const state = {
    connected: false
  }

  let client = new service.client.Connection(controllerData.url, {
    apiKey: controllerData.apiKey
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

  const updateControllerApiKey = function (remoteData) {
    client = new service.client.Connection(controllerData.url, {
      apiKey: remoteData.apiKey
    })
    return service.config.set('controllerApiKey', remoteData.apiKey)
      .then(() => {
        return service.config.get()
          .then((config) => {
            console.log(JSON.stringify(config, null, 2))
            return Promise.resolve()
          })
      })
  }

  const addService = function () {
    return service.tracer.info(templates.compiled.registeringService())
      .then(() => {
        return client.post(SERVICES_URL, {
          description: serviceData.description,
          id: serviceData.id,
          name: serviceData.name,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey
        })
      })
      .then((remoteData) => {
        return updateControllerApiKey(remoteData)
      })
  }

  const ensureServiceIsRegistered = function () {
    return client.get(SERVICES_URL + '/' + serviceData.name)
      .then((remoteData) => {
        if (remoteData.id !== serviceData.id) {
          return Promise.reject(new service.errors.Conflict(templates.compiled.serviceNameAlreadyDefined()))
        } else {
          return updateServiceInfo(remoteData)
        }
      })
      .catch(service.errors.NotFound, () => {
        return addService()
      })
  }

  const updateServiceInfo = function (remoteData) {
    return service.tracer.info(templates.compiled.updatingServiceInfo())
      .then(() => {
        return client.patch(SERVICES_URL + '/' + serviceData.name, {
          description: serviceData.description,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey
        })
      })
  }

  const registerService = function () {
    return ensureServiceIsRegistered()
      .catch(service.errors.Forbidden, () => {
        return Promise.reject(new service.errors.Forbidden(templates.compiled.controllerAuthError()))
      })
      .then(setConnected)
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
