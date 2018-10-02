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

// TODO, refactor this
const Client = function (service, controllerData, serviceData, abilities) {
  // const authUrl = service.utils.services.authApiKeyUrl()
  const servicesUrl = uris.services()
  // const serviceUrl = service.utils.services.serviceUrl(serviceData.name)
  // const serviceAbilitiesUrl = service.utils.services.serviceAbilitiesUrl(serviceData.name)
  // const abilitiesUrl = service.utils.services.abilitiesUrl()

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
          id: serviceData.id,
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
    return service.tracer.info(templates.compiled.updatingServiceInfo())
      .then(() => {
        return client.patch(`${servicesUrl}/${registeredService._id}`, {
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
    return client.get(servicesUrl)
      .then(response => {
        const remoteData = response.body
        // TODO, add a query filter to api ?name=x
        const registeredService = (remoteData.find(remoteService => remoteService.name === serviceData.name) || [])[0]

        if (registeredService && registeredService.id !== serviceData.id) {
          return Promise.reject(new service.errors.Conflict(templates.compiled.serviceNameAlreadyDefined()))
        }
        return Promise.resolve(registeredService)
      })
  }

  const registerService = function () {
    return checkServiceExists()
      .then(registeredService => {
        if (registeredService) {
          return updateServiceInfo(registeredService)
        }
        return addService()
      })
      .then(serviceId => {
        console.log('service Id --------------------------')
        console.log(serviceId)
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
        if (ability.description !== remoteAbility.description) {
          return service.tracer.info(templates.compiled.updatingAbility({
            type: ability.type,
            name: ability.name
          })).then(() => {
            return client.patch(`abilities/${ability._id}`, {
              description: ability.description
            })
          })
        }
      }
    })

    // TODO, deprecate abilities API
    return Promise.resolve()
    /* if (!correspondence) {
      return service.tracer.info(templates.compiled.deprecatingAbility({
        type: remoteAbility.type,
        name: remoteAbility.name
      })).then(() => {
        return client.patch(service.utils.services.abilityUrl(remoteAbility.id), {
          deprecated: true
        })
      })
    } */
  }

  const registerNewAbility = function (ability) {
    if (ability.registered) {
      return Promise.resolve()
    }
    return service.tracer.info(templates.compiled.creatingAbility({
      type: ability.type,
      name: ability.name
    })).then(() => {
      return client.post('abilities', ability)
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
    return client.get(`abilities?service=${controllerData.serviceId}`)
      .then((remoteAbilities) => {
        return Promise.map(remoteAbilities.body, checkAbilityCorrespondence)
      }).then(() => {
        return registerNewAbilities()
      })
  }

  const registerUser = function () {
    return client.post('users', {
      name: serviceData.name,
      role: 'service'
    }).then(response => {
      return Promise.resolve({
        _id: response.headers.location.split('/').pop()
      })
    })
  }

  const getCurrentLoggedUser = function () {
    return client.get('users/me')
      .then(response => Promise.resolve(response.body))
  }

  const checkUserId = function (loggedUserData) {
    if (loggedUserData._id === controllerData.userId) {
      return Promise.resolve(loggedUserData)
    }
    return Promise.reject(new service.errors.Conflict(templates.compiled.serviceUserAlreadyDefined()))
  }

  const getControllerUser = function () {
    return client.get(`users?name=${serviceData.name}`)
      .then(response => {
        if (response.body.length) {
          return checkUserId(response.body[0])
        }
        return registerUser()
      })
  }

  const getServiceUser = function () {
    return getCurrentLoggedUser()
      .then(loggedUser => {
        if (loggedUser.role === 'service') {
          return checkUserId(loggedUser)
        }
        return getControllerUser()
      })
  }

  const getApiKey = function (userData) {
    return client.get(`auth/tokens?type=apiKey&user=${userData._id}`)
      .then(response => {
        if (response.body.length) {
          return Promise.resolve(response.body[0])
        }
        return client.post(`auth/apikey`, {
          user: userData._id
        }).then(response => {
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
            return Promise.resolve({
              url: controllerData.url,
              userId: userData._id,
              apiKey
            })
          })
      })
  }

  const storeControllerData = function (data) {
    return service.storage.set('controllerData', data)
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
