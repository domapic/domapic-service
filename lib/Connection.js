'use strict'

const _ = require('lodash')

const Promise = require('bluebird')
const randToken = require('rand-token')
const ip = require('ip')

const Client = require('./Client')
const templates = require('./templates')
const connectionApi = require('./api/connection.json')

const SERVICE_ID_KEY = 'serviceId'

const Connection = function (service, security) {
  let _serviceIdPromise
  let _client
  let _abilities = []

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

  const getHost = function () {
    return service.config.get('hostName')
      .then(hostName => {
        if (hostName) {
          return Promise.resolve(hostName)
        }
        return Promise.resolve(ip.address())
      })
  }

  const getServiceUrl = function () {
    return Promise.props({
      isSsl: service.config.get('sslKey'),
      host: getHost(),
      port: service.config.get('port')
    }).then(urlData => {
      const ssl = urlData.isSsl ? 's' : ''
      return Promise.resolve(`http${ssl}://${urlData.host}:${urlData.port}`)
    })
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
      apiKey: security.getApiKeyForController(),
      url: getServiceUrl()
    })
  }

  const openConnection = function (controllerData, serviceData) {
    _client = new Client(service, controllerData, serviceData, _abilities)
    return _client.connect()
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

  const logApiKey = function (apiKey) {
    return security.getApiKeyForController()
      .then((apiKey) => {
        return service.tracer.warn(templates.compiled.controllerApiKey({
          key: apiKey
        }))
      })
  }

  const checkController = function (options) {
    if (!options.controller) {
      return Promise.reject(new service.errors.BadData(templates.compiled.noControllerConfigured()))
    }
    return Promise.resolve()
  }

  const executeConnect = function (options = {}) {
    return checkController(options)
      .then(() => {
        return service.tracer.info(templates.compiled.connecting())
          .then(getServiceData)
          .then((serviceData) => {
            return openConnection({
              url: options.controller,
              apiKey: options.controllerApiKey
            }, serviceData)
          })
      })
  }

  const connectApiHandler = function (params, body, res, user) {
    return executeConnect({
      controller: body.url,
      apiKey: body.apiKey
    })
  }

  const connect = function (options = {}) {
    return executeConnect(options)
      .catch(error => {
        return traceConnectionError(error)
          .then(logApiKey)
          .then(() => {
            return Promise.reject(error)
          })
      })
  }

  const getClient = function () {
    if (_client) {
      return Promise.resolve(_client)
    }
    return Promise.reject(new service.errors.ServerUnavailable(templates.compiled.notConnected()))
  }

  const sendEvent = function (name, data) {
    return getClient()
      .then((client) => {
        return client.sendEvent(name, data)
      })
  }

  const addAbility = function (ability, abilityName) {
    const abilityToPush = _.omitBy({
      name: abilityName,
      ...ability,
      ...ability.data,
      action: !!ability.action,
      state: !!ability.state,
      event: !!ability.event,
      actionDescription: ability.action && ability.action.description,
      stateDescription: ability.state && ability.state.description,
      eventDescription: ability.event && ability.event.description
    }, _.isUndefined)
    delete abilityToPush.data

    _abilities.push(abilityToPush)

    return Promise.resolve()
  }

  const addApi = function () {
    return service.server.extendOpenApi(connectionApi)
      .then(() => {
        return service.server.addOperations({
          connection: {
            handler: connectApiHandler
          }
        })
      })
  }

  return {
    addApi: addApi,
    connect: connect,
    sendEvent: sendEvent,
    addAbility: addAbility
  }
}

module.exports = Connection
