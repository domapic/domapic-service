'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const deepEqual = require('deep-equal')

const templates = require('./templates')
const events = require('./events')
const uris = require('./uris')

const OMIT_IN_ABILITIES_COMPARATION = [
  '_id',
  'description',
  'actionDescription',
  'stateDescription',
  'eventDescription',
  '_service',
  '_user',
  'createdAt',
  'updatedAt'
]

const Client = function (service, controllerData, serviceData, serviceAbilities) {
  const abilities = _.cloneDeep(serviceAbilities)

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
    return service.tracer.debug(templates.compiled.registeringService())
      .then(() => {
        return client.post(uris.services(), {
          processId: serviceData.id,
          description: serviceData.description,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey,
          url: serviceData.url
        }).then(response => {
          return Promise.resolve(response.headers.location.split('/').pop())
        })
      })
  }

  const updateServiceInfo = function (registeredService) {
    return service.tracer.debug(templates.compiled.updatingServiceInfo())
      .then(() => {
        return client.patch(uris.service(registeredService._id), {
          description: serviceData.description,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey,
          url: serviceData.url
        })
      })
      .then(() => {
        return Promise.resolve(registeredService._id)
      })
  }

  const checkServiceExists = () => {
    return service.tracer.debug(templates.compiled.checkingControllerRegisteredService())
      .then(() => client.get(uris.services()))
      .then(response => {
        const remoteData = response.body
        // TODO, add a query filter to api ?name=x
        const registeredService = remoteData.find(remoteService => remoteService.name === serviceData.name)

        if (registeredService && registeredService.processId !== serviceData.id) {
          return Promise.reject(new service.errors.Conflict(templates.compiled.serviceNameAlreadyDefined()))
        }
        return Promise.resolve(registeredService)
      })
  }

  const registerService = function () {
    return checkServiceExists()
      .then(registeredService => {
        if (registeredService) {
          return service.tracer.debug(templates.compiled.serviceAlreadyRegistered(registeredService))
            .then(() => updateServiceInfo(registeredService))
        }
        return addService()
      })
      .then(serviceId => {
        controllerData.serviceId = serviceId
        return Promise.resolve()
      })
  }

  const checkAbilityCorrespondence = function (remoteAbility) {
    let correspondence = false
    _.each(abilities, (ability) => {
      if (correspondence) {
        return false
      }
      if (deepEqual(_.omit(ability, OMIT_IN_ABILITIES_COMPARATION), _.omit(remoteAbility, OMIT_IN_ABILITIES_COMPARATION))) {
        correspondence = true
        ability.registered = true
        ability._id = remoteAbility._id
        if (ability.description !== remoteAbility.description ||
            ability.actionDescription !== remoteAbility.actionDescription ||
            ability.stateDescription !== remoteAbility.stateDescription ||
            ability.eventDescription !== remoteAbility.eventDescription) {
          return service.tracer.debug(templates.compiled.updatingAbility({
            name: ability.name
          })).then(() => {
            return client.patch(uris.ability(ability._id), {
              description: ability.description,
              actionDescription: ability.actionDescription,
              stateDescription: ability.stateDescription,
              eventDescription: ability.eventDescription
            })
          })
        }
      }
    })

    if (!correspondence) {
      return service.tracer.debug(templates.compiled.deletingAbility({
        name: remoteAbility.name
      })).then(() => {
        return client.delete(uris.ability(remoteAbility._id))
      })
    }
  }

  const registerNewAbility = function (ability) {
    if (ability.registered) {
      return Promise.resolve()
    }
    return service.tracer.debug(templates.compiled.creatingAbility({
      name: ability.name
    })).then(() => {
      return client.post(uris.abilities(), ability)
        .then(response => {
          ability._id = response.headers.location.split('/').pop()
          return Promise.resolve()
        })
    })
  }

  const registerNewAbilities = function () {
    return Promise.map(abilities, registerNewAbility)
  }

  const registerAbilities = function () {
    return service.tracer.debug(templates.compiled.gettingRegisteredAbilities())
      .then(() => client.get(uris.query(uris.abilities(), {
        service: controllerData.serviceId
      })))
      .then((remoteAbilities) => {
        return service.tracer.debug(templates.compiled.checkingRemoteAbilities())
          .then(() => Promise.map(remoteAbilities.body, checkAbilityCorrespondence))
      }).then(() => {
        return registerNewAbilities()
      })
  }

  const registerUser = function () {
    return service.tracer.debug(templates.compiled.registeringServiceUser())
      .then(() => client.post(uris.users(), {
        name: serviceData.name,
        role: 'service'
      }).then(response => {
        return Promise.resolve({
          _id: response.headers.location.split('/').pop()
        })
      })
      )
  }

  const getCurrentLoggedUser = function () {
    return client.get(uris.usersMe())
      .then(response => Promise.resolve(response.body))
  }

  const checkUserId = function (loggedUserData) {
    if (loggedUserData._id === controllerData.userId) {
      return Promise.resolve(loggedUserData)
    }
    return Promise.reject(new service.errors.Conflict(templates.compiled.serviceUserAlreadyDefined()))
  }

  const getControllerUser = function () {
    return client.get(uris.query(uris.users(), {
      name: serviceData.name,
      role: 'service'
    }))
      .then(response => {
        if (response.body.length) {
          return service.tracer.debug(templates.compiled.serviceUserAlreadyRegistered(response.body[0]))
            .then(() => checkUserId(response.body[0]))
        }
        return registerUser()
      })
  }

  const getServiceUser = function () {
    return getCurrentLoggedUser()
      .then(loggedUser => {
        if (loggedUser.role === 'service') {
          return service.tracer.debug(templates.compiled.currentLoggedUserIsService())
            .then(() => checkUserId(loggedUser))
        }
        return service.tracer.debug(templates.compiled.currentLoggedUserIsServiceRegisterer())
          .then(() => getControllerUser())
      })
  }

  const getApiKey = function (userData) {
    return service.tracer.debug(templates.compiled.gettingUserApiKey())
      .then(() => client.get(uris.query(uris.authTokens(), {
        type: 'apiKey',
        user: userData._id
      })))
      .then(response => {
        if (response.body.length) {
          return Promise.resolve(response.body[0].token)
        }
        return service.tracer.debug(templates.compiled.addingUserApiKey())
          .then(() => client.post(uris.authApiKey(), {
            user: userData._id
          }))
          .then(response => {
            return Promise.resolve(response.body.apiKey)
          })
      })
  }

  const doLogin = function () {
    return getServiceUser()
      .then(userData => {
        return getApiKey(userData)
          .then(apiKey => {
            client = new service.client.Connection(controllerData.url, {
              apiKey: apiKey
            })
            return service.tracer.debug(templates.compiled.loggingIntoController({
              ...userData,
              apiKey
            })).then(() => Promise.resolve({
              url: controllerData.url,
              userId: userData._id,
              apiKey
            }))
          })
      })
  }

  const storeControllerData = function (data) {
    return service.tracer.debug(templates.compiled.storingControllerData())
      .then(() => service.storage.set('controllerData', data))
  }

  const connect = function () {
    return updateConnectionState(
      checkServiceExists()
        .then(doLogin)
        .then(storeControllerData)
        .then(registerService)
        .then(registerAbilities)
        .catch(service.errors.Forbidden, () => {
          return Promise.reject(new service.errors.Forbidden(templates.compiled.controllerAuthError()))
        })
    )
  }

  const sendEvent = function (name, data) {
    const abilityId = abilities.find(ability => ability.name === name)._id
    return updateConnectionState(
      client.post(uris.abilityEventHandler(abilityId), data)
    )
  }

  return {
    connect: connect,
    sendEvent: sendEvent
  }
}

module.exports = Client
