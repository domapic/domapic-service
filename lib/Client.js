'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const deepEqual = require('deep-equal')

const templates = require('./templates')
const events = require('./events')
const ApiClient = require('./ApiClient')
const { SERVICE_TYPES } = require('./utils')

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

const Client = function (service, controllerData, serviceData, serviceAbilities, pluginConfigs) {
  const abilities = _.cloneDeep(serviceAbilities)

  const state = {
    connected: false
  }

  const setConnected = function (result) {
    if (!state.connected) {
      state.connected = true
      events.emit('connection', true)
    }
    return Promise.resolve(result)
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

  const ErrorHandledApiClient = function (client) {
    const wrappedClient = {}
    _.each(client, (method, methodName) => {
      wrappedClient[methodName] = (pathParams, queryParams) => {
        return updateConnectionState(method(pathParams, queryParams))
      }
    })

    return wrappedClient
  }

  const ResponseHandledApiClient = function (apiKey) {
    const client = new ApiClient(service, controllerData.url, apiKey)
    const wrappedClient = {}
    _.each(client, (method, methodName) => {
      wrappedClient[methodName] = (pathParams, queryParams) => {
        return method(pathParams, queryParams)
          .then(response => Promise.resolve(response && response.body ? response.body : response))
      }
    })

    return wrappedClient
  }

  let apiClient = new ResponseHandledApiClient(controllerData.apiKey)
  let errorHandledApiClient = new ErrorHandledApiClient(apiClient)

  const addService = function () {
    return service.tracer.debug(templates.compiled.registeringService())
      .then(() => {
        return apiClient.createService({
          name: serviceData.name,
          processId: serviceData.id,
          description: serviceData.description,
          package: serviceData.package,
          version: serviceData.version,
          apiKey: serviceData.apiKey,
          url: serviceData.url,
          type: serviceData.type
        })
      })
  }

  const updateServiceInfo = function (registeredService) {
    return service.tracer.debug(templates.compiled.updatingServiceInfo())
      .then(() => {
        return apiClient.updateService(registeredService._id, {
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
      .then(() => apiClient.getServices())
      .then(remoteData => {
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

  const addPluginConfig = pluginConfig => {
    return apiClient.getServicePluginConfigs({
      service: controllerData.serviceId,
      'plugin-package-name': pluginConfig.pluginPackageName
    }).then(pluginConfigs => {
      if (pluginConfigs.length) {
        return Promise.resolve()
      }
      return apiClient.createServicePluginConfig({
        _service: controllerData.serviceId,
        ...pluginConfig
      })
    })
  }

  const addPluginConfigs = () => {
    if (!pluginConfigs.length) {
      return Promise.resolve()
    }
    return Promise.map(pluginConfigs, addPluginConfig)
  }

  const checkAbilityCorrespondence = function (remoteAbility) {
    if (remoteAbility._service !== controllerData.serviceId) {
      return Promise.resolve()
    }
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
            return apiClient.updateAbility(ability._id, {
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
        return apiClient.deleteAbility(remoteAbility._id)
      })
    }
  }

  const registerNewAbility = function (ability) {
    if (ability.registered) {
      return Promise.resolve()
    }
    return service.tracer.debug(templates.compiled.creatingAbility({
      name: ability.name
    })).then(() => apiClient.createAbility({
      ...ability,
      _service: controllerData.serviceId
    }).then(id => {
      ability._id = id
      return Promise.resolve(id)
    }))
  }

  const registerNewAbilities = function () {
    return Promise.map(abilities, registerNewAbility)
  }

  const registerAbilities = function () {
    if (serviceData.type !== SERVICE_TYPES.MODULE) {
      return Promise.resolve()
    }
    return service.tracer.debug(templates.compiled.gettingRegisteredAbilities())
      .then(() => apiClient.getAbilities({
        service: controllerData.serviceId
      }))
      .then(remoteAbilities => {
        return service.tracer.debug(templates.compiled.checkingRemoteAbilities())
          .then(() => Promise.map(remoteAbilities, checkAbilityCorrespondence))
      }).then(() => {
        return registerNewAbilities()
      })
  }

  const registerUser = function () {
    return service.tracer.debug(templates.compiled.registeringServiceUser())
      .then(() => apiClient.createUser({
        name: serviceData.name,
        role: serviceData.type
      }).then(id => {
        return Promise.resolve({
          _id: id
        })
      }))
  }

  const getCurrentLoggedUser = function () {
    return apiClient.getUserMe()
  }

  const checkUserId = function (loggedUserData) {
    if (loggedUserData._id === controllerData.userId) {
      return Promise.resolve(loggedUserData)
    }
    return Promise.reject(new service.errors.Conflict(templates.compiled.serviceUserAlreadyDefined()))
  }

  const getControllerUser = function () {
    return apiClient.getUsers({
      name: serviceData.name,
      role: serviceData.type
    }).then(response => {
      if (response.length) {
        return service.tracer.debug(templates.compiled.serviceUserAlreadyRegistered(response[0]))
          .then(() => checkUserId(response[0]))
      }
      return registerUser()
    })
  }

  const getServiceUser = function () {
    const role = serviceData.type
    return getCurrentLoggedUser()
      .then(loggedUser => {
        if (loggedUser.role === role) {
          return service.tracer.debug(templates.compiled.currentLoggedUserIsService({
            role
          }))
            .then(() => checkUserId(loggedUser))
        }
        return service.tracer.debug(templates.compiled.currentLoggedUserIsServiceRegisterer())
          .then(() => getControllerUser())
      })
  }

  const getApiKey = function (userData) {
    return service.tracer.debug(templates.compiled.gettingUserApiKey())
      .then(() => apiClient.getAuthTokens({
        type: 'apiKey',
        user: userData._id
      }))
      .then(response => {
        if (response.length) {
          return Promise.resolve(response[0].token)
        }
        return service.tracer.debug(templates.compiled.addingUserApiKey())
          .then(() => apiClient.createApiKey({
            user: userData._id
          }).then(response => {
            return Promise.resolve(response.apiKey)
          }))
      })
  }

  const doLogin = function () {
    return getServiceUser()
      .then(userData => {
        return getApiKey(userData)
          .then(apiKey => {
            apiClient = new ResponseHandledApiClient(apiKey)
            errorHandledApiClient = new ErrorHandledApiClient(apiClient)
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
        .then(addPluginConfigs)
        .then(registerAbilities)
        .catch(service.errors.Forbidden, () => {
          return Promise.reject(new service.errors.Forbidden(templates.compiled.controllerAuthError()))
        })
    )
  }

  const sendAbilityEvent = function (name, data) {
    const abilityId = abilities.find(ability => ability.name === name)._id
    return errorHandledApiClient.sendAbilityEvent(abilityId, data)
  }

  const getApi = () => errorHandledApiClient

  return {
    connect,
    sendAbilityEvent,
    getApi
  }
}

module.exports = Client
