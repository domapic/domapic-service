'use strict'

const _ = require('lodash')
const randToken = require('rand-token')

const templates = require('./templates')

const STORAGE_KEY = 'apiKeys'
const REFERENCE_FIELD = 'reference'
const CONTROLLER_REFERENCE = 'controller-connection'
const CONTROLLER_USER = 'controller'
const ADMIN_ROL = 'admin'

const Security = function (service) {
  let _apiKeys

  const readApiKeys = function () {
    if (_apiKeys) {
      return Promise.resolve(_apiKeys)
    }
    return service.storage.get(STORAGE_KEY)
      .catch(() => {
        return service.storage.set(STORAGE_KEY, [])
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
    return service.storage.set(STORAGE_KEY, apiKeys)
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
    return getUserData(reference, REFERENCE_FIELD)
      .then((userData) => {
        if (userData) {
          return Promise.reject(new service.errors.BadData(templates.compiled.apiKeyAlreadyExists({
            reference: reference
          })))
        }
        return createApiKey(name, rol, reference)
          .then((apiKey) => {
            _apiKeys.push(apiKey)
            return service.storage.set(STORAGE_KEY, _apiKeys)
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
    if (userData.rol === ADMIN_ROL) {
      return Promise.resolve()
    }
    return Promise.reject(new service.errors.Unauthorized(templates.compiled.apiKeyUserNotAllowed()))
  }

  const getApiKeyForController = function () {
    return getUserData(CONTROLLER_REFERENCE, REFERENCE_FIELD)
      .then((userData) => {
        if (userData) {
          return service.tracer.warn(templates.compiled.controllerApiKey({
            key: userData.key
          }))
        }
        return saveApiKey(CONTROLLER_USER, ADMIN_ROL, CONTROLLER_REFERENCE)
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
