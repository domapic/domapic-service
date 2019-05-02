'use strict'

const _ = require('lodash')
const uris = require('./uris')

const ApiClient = function (service, url, apiKey) {
  const client = new service.client.Connection(url, {
    apiKey
  })

  const getCreatedId = response => Promise.resolve(response.headers.location.split('/').pop())

  // auth tokens
  const getAuthTokens = filter => client.get(uris.query(uris.authTokens(), filter))

  const getApiKeys = filter => {
    const query = {
      ...filter,
      type: 'apiKey'
    }
    return client.get(uris.query(uris.authTokens(), query))
  }

  const createApiKey = data => client.post(uris.authApiKey(), data)

  // users
  const getUsers = filter => {
    if (filter) {
      return client.get(uris.query(uris.users(), filter))
    }
    return client.get(uris.users())
  }

  const getUser = id => client.get(uris.user(id))

  const getOperatorUsers = filter => {
    if (_.isString(filter)) {
      return getUser(filter)
    }
    const query = {
      ...filter,
      role: 'operator'
    }
    return client.get(uris.query(uris.users(), query))
  }

  const createUser = data => {
    console.log("CREATING USER")
    console.log(data)
    return client.post(uris.users(), data)
    .catch(err => {
      console.log(err)
      return Promise.reject(err)
    })
    .then(response => {
      console.log('-------response')
      console.log(response)
      return Promise.resolve(response)
    })
    .then(getCreatedId)
  }

  const createOperatorUser = data => client.post(uris.users(), { ...data, role: 'operator' })
    .then(getCreatedId)

  const getUserMe = () => client.get(uris.usersMe())

  // services
  const getService = id => client.get(uris.service(id))

  const getServices = filter => {
    if (_.isString(filter)) {
      return getService(filter)
    }
    if (filter) {
      return client.get(uris.query(uris.services(), filter))
    }
    return client.get(uris.services())
  }

  const createService = data => client.post(uris.services(), data)
    .then(getCreatedId)

  const updateService = (id, data) => client.patch(uris.service(id), data)

  // servicePluginConfigs
  const getServicePluginConfig = id => client.get(uris.servicePluginConfig(id))

  const getServicePluginConfigs = filter => {
    if (_.isString(filter)) {
      return getServicePluginConfig(filter)
    }
    if (filter) {
      return client.get(uris.query(uris.servicePluginConfigs(), filter))
    }
    return client.get(uris.servicePluginConfigs())
  }

  const createServicePluginConfig = data => client.post(uris.servicePluginConfigs(), data)
    .then(getCreatedId)

  const updateServicePluginConfig = (id, data) => client.patch(uris.servicePluginConfig(id), data)

  // abilities
  const getAbility = id => client.get(uris.ability(id))

  const getAbilities = filter => {
    if (_.isString(filter)) {
      return getAbility(filter)
    }
    if (filter) {
      return client.get(uris.query(uris.abilities(), filter))
    }
    return client.get(uris.abilities())
  }

  const createAbility = data => client.post(uris.abilities(), data)
    .then(getCreatedId)

  const updateAbility = (id, data) => client.patch(uris.ability(id), data)

  const deleteAbility = id => client.delete(uris.ability(id))

  const getAbilityState = id => client.get(uris.abilityState(id))

  const sendAbilityEvent = (id, data) => client.post(uris.abilityEvent(id), data)

  const sendAbilityAction = (id, data) => client.post(uris.abilityAction(id), data)

  const getLogs = filter => {
    if (filter) {
      return client.get(uris.query(uris.logs(), filter))
    }
    return client.get(uris.logs())
  }

  const getConfig = () => client.get(uris.config())

  return {
    getAuthTokens,
    createApiKey,
    getApiKeys,

    getUsers,
    getOperatorUsers,
    createUser,
    createOperatorUser,
    getUserMe,

    getServices,
    createService,
    updateService,

    getServicePluginConfigs,
    createServicePluginConfig,
    updateServicePluginConfig,

    getAbilities,
    createAbility,
    updateAbility,
    deleteAbility,
    getAbilityState,
    sendAbilityEvent,
    sendAbilityAction,

    getLogs,

    getConfig
  }
}

module.exports = ApiClient
