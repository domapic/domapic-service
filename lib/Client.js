'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const deepEqual = require('deep-equal')

const templates = require('./templates')
const events = require('./events')

const Client = function (service, controllerData, serviceData, abilities) {
  const authUrl = service.utils.services.authApiKeyUrl()
  const servicesUrl = service.utils.services.servicesUrl()
  const serviceUrl = service.utils.services.serviceUrl(serviceData.name)
  const serviceAbilitiesUrl = service.utils.services.serviceAbilitiesUrl(serviceData.name)
  const abilitiesUrl = service.utils.services.abilitiesUrl()

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

  const addService = function () {
    return service.tracer.info(templates.compiled.registeringService())
      .then(() => {
        return client.post(servicesUrl, {
          description: serviceData.description,
          id: serviceData.id,
          name: serviceData.name,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey,
          url: serviceData.url
        })
      })
  }

  const updateServiceInfo = function (remoteData) {
    return service.tracer.info(templates.compiled.updatingServiceInfo())
      .then(() => {
        return client.patch(serviceUrl, {
          description: serviceData.description,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey,
          url: serviceData.url
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

  const checkAbilityCorrespondence = function (remoteAbility) {
    let correspondence = false
    _.each(abilities, (ability) => {
      if (correspondence) {
        return false
      }
      if (ability.name === remoteAbility.name && ability.type === remoteAbility.type && deepEqual(ability.data, remoteAbility.data)) {
        correspondence = true
        ability.registered = true
        ability.id = remoteAbility.id
        if (ability.description !== remoteAbility.description) {
          return service.tracer.info(templates.compiled.updatingAbility({
            type: ability.type,
            name: ability.name
          })).then(() => {
            return client.patch(service.utils.services.abilityUrl(ability.id), {
              description: ability.description
            })
          })
        }
      }
    })

    if (!correspondence) {
      return service.tracer.info(templates.compiled.deprecatingAbility({
        type: remoteAbility.type,
        name: remoteAbility.name
      })).then(() => {
        return client.patch(service.utils.services.abilityUrl(remoteAbility.id), {
          deprecated: true
        })
      })
    }
  }

  const registerNewAbility = function (ability) {
    if (ability.registered) {
      return Promise.resolve()
    }
    return service.tracer.info(templates.compiled.creatingAbility({
      type: ability.type,
      name: ability.name
    })).then(() => {
      return client.post(abilitiesUrl, Object.assign({}, ability, {
        service: serviceData.id
      }))
    })
  }

  const registerNewAbilities = function () {
    return Promise.map(abilities, registerNewAbility)
  }

  const registerAbilities = function () {
    return client.get(serviceAbilitiesUrl)
      .then((remoteAbilities) => {
        return Promise.map(remoteAbilities, checkAbilityCorrespondence)
      }).then(() => {
        return registerNewAbilities()
      })
  }

  const registerUser = function () {
    return client.post(authUrl, {
      user: serviceData.name,
      role: 'service',
      reference: `Api key for service ${serviceData.name}`
    }).then((response) => {
      return service.config.set('controllerApiKey', response.apiKey)
        .then(() => {
          client = new service.client.Connection(controllerData.url, {
            apiKey: response.apiKey
          })
          return Promise.resolve()
        })
    })
  }

  const registerService = function () {
    return updateConnectionState(
      registerUser()
        .then(ensureServiceIsRegistered)
        .then(registerAbilities)
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
