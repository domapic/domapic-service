'use strict'

const Promise = require('bluebird')
const randToken = require('rand-token')

const Client = require('./Client')
const templates = require('./templates')

const SERVICE_ID_KEY = 'serviceId'

const Connection = function (service) {
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

  const getControllerUrl = function () {
    return getConfigurationProperty('controller', templates.compiled.noControllerConfigured())
    // TODO, search automatically for controller in local network
  }

  const getControllerApiKey = function () {
    return getConfigurationProperty('controllerApiKey', templates.compiled.noControllerApiKeyConfigured())
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

  const getServiceName = function () {
    return Promise.resolve(service.info.name)
  }

  const addApi = function (ability) {
    return service.tracer.log(templates.compiled.addingConnectionApi())
  }

  const getConnectionInfo = function () {
    return Promise.props({
      controller: getControllerUrl(),
      controllerApiKey: getControllerApiKey(),
      serviceName: getServiceName(),
      serviceId: getServiceId()
    })
  }

  const openConnection = function (connectionInfo) {
    _client = new Client(service, connectionInfo)
    return _client.registerService()
      .then(() => {
        return service.tracer.info(templates.compiled.connected(connectionInfo))
      })
  }

  const connect = function () {
    return service.tracer.info(templates.compiled.connecting())
      .then(getConnectionInfo)
      .then(openConnection)
      .catch((err) => {
        return service.tracer.group([
          {
            error: [templates.compiled.errorConnecting(), err.message]
          },
          {
            trace: err.stack
          }
        ])
      })
  }

  const get = function () {
    if (!_client) {
      return Promise.reject(new service.errors.ServerUnavailable(templates.compiled.notConnected()))
    }
    return Promise.resolve(_client)
  }

  return {
    addApi: addApi,
    connect: connect,
    get: get
  }
}

module.exports = Connection
