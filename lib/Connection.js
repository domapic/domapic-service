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
    return Promise.resolve(service.info.package)
  }

  const getVersion = function () {
    return Promise.resolve(service.info.version)
  }

  const getDescription = function () {
    return Promise.resolve(service.info.description)
  }

  const addApi = function (ability) {
    // TODO, add api
    return service.tracer.log(templates.compiled.addingConnectionApi())
  }

  const getConnectionInfo = function () {
    return Promise.props({
      controller: getControllerUrl(),
      controllerApiKey: getControllerApiKey(),
      serviceName: getServiceName(),
      serviceId: getServiceId(),
      packageName: getPackageName(),
      version: getVersion(),
      description: getDescription()
    })
  }

  const openConnection = function (connectionInfo) {
    _client = new Client(service, connectionInfo)
    return _client.registerService()
      .then(() => {
        return service.tracer.info(templates.compiled.connected(connectionInfo))
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

  const connect = function () {
    return service.tracer.info(templates.compiled.connecting())
      .then(getConnectionInfo)
      .then(openConnection)
      .catch((err) => {
        return traceConnectionError(err)
      })
  }

  const getClient = function () {
    if (_client && _client.state && _client.state.connected) {
      return Promise.resolve(_client)
    }
    return Promise.reject(new service.errors.ServerUnavailable(templates.compiled.notConnected()))
  }

  return {
    addApi: addApi,
    connect: connect,
    getClient: getClient
  }
}

module.exports = Connection
