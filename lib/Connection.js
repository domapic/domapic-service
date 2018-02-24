'use strict'

const Promise = require('bluebird')
const randToken = require('rand-token')

const Client = require('./Client')
const templates = require('./templates')

const SERVICE_ID_KEY = 'serviceId'

const Connection = function (service, security) {
  let _serviceIdPromise
  let _client

  const getConfigurationProperty = function (key, errorMessage) {
    return service.config.get(key)
      .then((configProperty) => {
        if (!configProperty) {
          return Promise.reject(new service.errors.BadData(errorMessage))
        }
        return Promise.resolve(configProperty)
      })
  }

  const getServiceName = function () {
    return getConfigurationProperty('name', templates.compiled.noServiceNameConfigured())
  }

  const getServiceId = function () {
    if (!_serviceIdPromise) {
      _serviceIdPromise = service.storage.get(SERVICE_ID_KEY)
        .catch(() => {
          return service.storage.set(SERVICE_ID_KEY, randToken.generate(32))
        })
    }
    return _serviceIdPromise
  }

  const getPackageName = function () {
    return Promise.resolve(service.info.name)
  }

  const getVersion = function () {
    return Promise.resolve(service.info.version)
  }

  const getDescription = function () {
    return Promise.resolve(service.info.description)
  }

  const getServiceData = function () {
    return Promise.props({
      name: getServiceName(),
      id: getServiceId(),
      package: getPackageName(),
      version: getVersion(),
      description: getDescription(),
      apiKey: security.getApiKeyForController()
    })
  }

  const openConnection = function (controllerData, serviceData) {
    _client = new Client(service, controllerData, serviceData)
    return _client.registerService()
      .then(() => {
        return service.tracer.info(templates.compiled.connected(controllerData))
      })
  }

  const traceConnectionError = function (error) {
    const tracesGroup = [{
      error: [templates.compiled.errorConnecting(), error.message]
    }]

    if (!service.errors.isControlled(error)) {
      tracesGroup.push({
        trace: error.stack
      })
    }
    return service.tracer.group(tracesGroup)
  }

  const connect = function (options) {
    options = options || {}
    if (!options.controller) {
      return Promise.reject(new service.errors.BadData(templates.compiled.noControllerConfigured()))
    }
    if (!options.controllerApiKey) {
      return Promise.reject(new service.errors.BadData(templates.compiled.noControllerApiKeyConfigured()))
    }
    return service.tracer.info(templates.compiled.connecting())
      .then(getServiceData)
      .then((serviceData) => {
        return openConnection({
          url: options.controller,
          apiKey: options.controllerApiKey
        }, serviceData)
      })
      .catch((error) => {
        return traceConnectionError(error)
          .then(() => {
            return Promise.reject(error)
          })
      })
  }

  const getClient = function () {
    if (_client && _client.state && _client.state.connected) {
      return Promise.resolve(_client)
    }
    return Promise.reject(new service.errors.ServerUnavailable(templates.compiled.notConnected()))
  }

  const addApi = function () {
    return Promise.resolve()
  }

  return {
    addApi: addApi,
    connect: connect,
    getClient: getClient
  }
}

module.exports = Connection
