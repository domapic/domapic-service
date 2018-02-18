'use strict'

const _ = require('lodash')
const randToken = require('rand-token')

const Security = function (service) {
  let _apiKeys

  const readApiKeys = function () {
    if (_apiKeys) {
      return Promise.resolve(_apiKeys)
    }
    return service.storage.get('apiKeys')
      .catch(() => {
        return service.storage.set('apiKeys', [])
          .then(() => {
            return readApiKeys()
          })
      })
      .then((storedApiKeys) => {
        _apiKeys = storedApiKeys
        return Promise.resolve(_apiKeys)
      })
  }

  const saveApiKeys = function (apiKeys) {
    _apiKeys = apiKeys
    return service.storage.set('apiKeys', apiKeys)
  }

  const getUserData = function (value, property) {
    return readApiKeys()
      .then((apiKeys) => {
        return Promise.resolve(_.find(apiKeys, (apiKeyData) => {
          return apiKeyData[property] === value
        }))
      })
  }

  const createApiKey = function (name, rol, reference) {
    return Promise.resolve({
      key: randToken.generate(32),
      user: name,
      rol: rol,
      reference: reference
    })
  }

  const saveApiKey = function (name, rol, reference) {
    return getUserData(reference, 'reference')
      .then((userData) => {
        if (userData) {
          // TODO, template
          return Promise.reject(new service.errors.BadData('ApiKey reference already exists'))
        }
        return createApiKey(name, rol, reference)
          .then((apiKey) => {
            _apiKeys.push(apiKey)
            return service.storage.set('apiKeys', _apiKeys)
          })
      })
  }

  const removeApiKey = function (apiKey) {
    return readApiKeys()
      .then((apiKeys) => {
        return saveApiKeys(_.remove(apiKeys, (apiKeyData) => {
          return apiKeyData.key === apiKey
        }))
      })
  }

  const checkUserPermissionToManageApiKeys = function (userData) {
    if (userData.rol === 'admin') {
      return Promise.resolve()
    }
    // TODO, template
    return Promise.reject(new service.errors.Unauthorized('User not allowed to manage api keys'))
  }

  const getApiKeyForController = function () {
    const API_KEY_REFERENCE = 'controller-connection'
    return getUserData(API_KEY_REFERENCE, 'reference')
      .then((userData) => {
        if (userData) {
          return service.tracer.info('CONTROLLER API KEY: ' + userData.key)
        }
        return saveApiKey('controller', 'admin', API_KEY_REFERENCE)
          .then(getApiKeyForController)
      })
  }

  const addApiKeyAuth = function () {
    return service.server.addAuthentication({
      apiKey: {
        verify: (apiKey) => {
          return getUserData(apiKey, 'key')
            .then((apiKeyData) => {
              if (apiKeyData) {
                return Promise.resolve({
                  user: apiKeyData.user,
                  rol: apiKeyData.rol
                })
              }
              return Promise.reject(new Error())
            })
        },
        authenticate: {
          auth: (userData) => {
            return checkUserPermissionToManageApiKeys(userData)
          },
          handler: (userData) => {
            return saveApiKey(userData)
          }
        },
        revoke: {
          auth: (userData) => {
            return checkUserPermissionToManageApiKeys(userData)
          },
          handler: (apiKey) => {
            return removeApiKey(apiKey)
          }
        }
      }
    }).then(getApiKeyForController)
  }

  return {
    addApiKeyAuth: addApiKeyAuth
  }
}

module.exports = Security
