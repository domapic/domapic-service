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

  const createApiKey = function (name, role, reference) {
    return Promise.resolve({
      key: randToken.generate(32),
      user: name,
      role: role,
      reference: reference
    })
  }

  const saveApiKey = function (name, role, reference) {
    return getUserData(reference, REFERENCE_FIELD)
      .then((userData) => {
        if (userData) {
          return Promise.reject(new service.errors.BadData(templates.compiled.apiKeyAlreadyExists({
            reference: reference
          })))
        }
        return createApiKey(name, role, reference)
          .then((apiKey) => {
            _apiKeys.push(apiKey)
            return service.storage.set(STORAGE_KEY, _apiKeys)
              .then(() => {
                return Promise.resolve(apiKey)
              })
          })
      })
  }

  const removeApiKey = function (apiKey) {
    return readApiKeys()
      .then((apiKeys) => {
        _.remove(apiKeys, (apiKeyData) => {
          return apiKeyData.key === apiKey
        })
        return saveApiKeys(apiKeys)
      })
  }

  const checkUserPermissionToManageApiKeys = function (userData) {
    if (userData.role === ADMIN_ROL) {
      return Promise.resolve()
    }
    return Promise.reject(new service.errors.Unauthorized(templates.compiled.apiKeyUserNotAllowed()))
  }

  const getApiKeyForController = function () {
    return getUserData(CONTROLLER_REFERENCE, REFERENCE_FIELD)
      .then((userData) => {
        if (userData) {
          return Promise.resolve(userData.key)
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
                  role: apiKeyData.role
                })
              }
              return Promise.reject(new Error())
            })
        },
        authenticate: {
          auth: (userData) => {
            return checkUserPermissionToManageApiKeys(userData)
          },
          handler: (params, body, res, userData) => {
            return saveApiKey(body.user, body.role, body.reference)
              .then((savedData) => {
                return Promise.resolve(savedData.key)
              })
          }
        },
        revoke: {
          auth: (userData) => {
            return checkUserPermissionToManageApiKeys(userData)
          },
          handler: (params, body, res, userData) => {
            const apiKey = params.path.apiKey
            return getUserData(apiKey, 'key')
              .then((apiKeyData) => {
                if (apiKeyData) {
                  return removeApiKey(apiKey)
                }
                return Promise.reject(new service.errors.BadData(templates.compiled.apiKeyDoesNotExist({
                  apiKey: apiKey
                })))
              })
          }
        }
      }
    }).then(getApiKeyForController)
  }

  const addApi = function () {
    // TODO, add api for getting api keys
    return service.tracer.log(templates.compiled.addingSecurityApi())
  }

  return {
    addApi: addApi,
    addApiKeyAuth: addApiKeyAuth,
    getApiKeyForController: getApiKeyForController
  }
}

module.exports = Security
