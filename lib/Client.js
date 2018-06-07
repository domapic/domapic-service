'use strict'

const Promise = require('bluebird')

const templates = require('./templates')
const events = require('./events')

const Client = function (service, controllerData, serviceData) {
  const servicesUrl = service.utils.services.servicesUrl()
  const serviceUrl = service.utils.services.serviceUrl(serviceData.name)
  const state = {
    connected: false
  }

  let client = new service.client.Connection(controllerData.url, {
    apiKey: controllerData.apiKey
  })

  const setConnected = function () {
    if (!state.connected) {
      state.connected = true
      events.emit('connection', true)
    }
    return Promise.resolve()
  }

  const setDisconnected = function () {
    if (state.connected) {
      state.connected = false
      events.emit('connection', false)
    }
    return Promise.resolve()
  }

  const setDisconnectedAndReject = function (err) {
    return setDisconnected()
      .then(() => {
        return Promise.reject(err)
      })
  }

  const updateConnectionState = function (promise) {
    return promise
      .then(setConnected)
      .catch(setDisconnectedAndReject)
  }

  const updateControllerApiKey = function (remoteData) {
    client = new service.client.Connection(controllerData.url, {
      apiKey: remoteData.apiKey
    })
    return service.config.set('controllerApiKey', remoteData.apiKey)
  }

  const addService = function () {
    return service.tracer.info(templates.compiled.registeringService())
      .then(() => {
        return client.post(servicesUrl, {
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

  const updateServiceInfo = function (remoteData) {
    return service.tracer.info(templates.compiled.updatingServiceInfo())
      .then(() => {
        return client.patch(serviceUrl, {
          description: serviceData.description,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey
        })
      })
  }

  const ensureServiceIsRegistered = function () {
    return client.get(serviceUrl)
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

  const registerService = function () {
    return updateConnectionState(
      ensureServiceIsRegistered()
        .catch(service.errors.Forbidden, () => {
          return Promise.reject(new service.errors.Forbidden(templates.compiled.controllerAuthError()))
        })
    )
  }

  const sendEvent = function (name, data) {
    return updateConnectionState(
      client.post(service.utils.services.serviceEventUrl(serviceData.name, name), data)
    )
  }

  return {
    registerService: registerService,
    sendEvent: sendEvent
  }
}

module.exports = Client
