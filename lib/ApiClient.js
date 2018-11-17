'use strict'

const uris = require('./uris')

const ApiClient = function (service, url, apiKey) {
  const client = new service.client.Connection(url, {
    apiKey
  })

  const getCreatedId = response => Promise.resolve(response.headers.location.split('/').pop())

  const getAuthTokens = filter => client.get(uris.query(uris.authTokens(), filter))

  const createApiKey = data => client.post(uris.authApiKey(), data)

  const getUsers = filter => {
    if (filter) {
      return client.get(uris.query(uris.users(), filter))
    }
    return client.get(uris.query(uris.users()))
  }

  const createUser = data => client.post(uris.users(), data)
    .then(getCreatedId)

  const getUserMe = () => client.get(uris.usersMe())

  const getServices = filter => {
    if (filter) {
      return client.get(uris.query(uris.services(), filter))
    }
    return client.get(uris.services())
  }

  const createService = data => client.post(uris.services(), data)
    .then(getCreatedId)

  const updateService = (id, data) => client.patch(uris.service(id), data)

  const getAbilities = filter => {
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

  const getLogs = () => client.get(uris.logs())

  return {
    getAuthTokens,
    createApiKey,
    getUsers,
    createUser,
    getUserMe,
    getServices,
    createService,
    updateService,
    getAbilities,
    createAbility,
    updateAbility,
    deleteAbility,
    getAbilityState,
    sendAbilityEvent,
    sendAbilityAction,
    getLogs
  }
}

module.exports = ApiClient
