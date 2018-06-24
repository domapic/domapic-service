'use strict'

const fs = require('fs')
const path = require('path')

const _ = require('lodash')

const fixtures = require('./fixtures.js')

const getHandlerKey = function (handlerKey) {
  if (!_.isUndefined(handlerKey) && handlerKey !== '') {
    return process.env[handlerKey]
  }
  return null
}

const Mocks = function (service) {
  const handlers = {
    getServices: {
      all: function () {
        return Promise.resolve(fixtures.services)
      }
    },
    getService: {
      'not-found': function () {
        return Promise.reject(new service.errors.NotFound('Service not found'))
      },
      exists: function () {
        const serviceData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', '..', process.env.domapic_path, '.domapic', 'foo-service', 'storage', 'service.json'), 'utf8'))
        return Promise.resolve(Object.assign({}, fixtures.services[1], {
          id: serviceData.serviceId
        }))
      },
      'exists-different-id': function () {
        return Promise.resolve(fixtures.services[1])
      }
    },
    updateService: {
      ok: function () {
        return Promise.resolve({})
      }
    },
    addService: {
      created: function (params, body, res, user) {
        res.status(201)
        res.header('location', '/services/example')
        return Promise.resolve({
          apiKey: 'foo-api-key-for-service'
        })
      }
    },
    getAbilities: {
      empty: function () {
        return Promise.resolve([])
      },
      update: function () {
        return Promise.resolve(fixtures.abilities)
      }
    },
    addAbility: {
      created: function (params, body, res) {
        res.status(201)
        res.header('location', '/abilities/123144234')
        return Promise.resolve()
      }
    },
    updateAbility: {
      ok: function () {
        return Promise.resolve({})
      }
    }
  }

  const parsers = {
    updateAbility: {
      params: {
        id: function (id) {
          return parseInt(id, 10)
        }
      }
    }
  }

  const GetOperation = function (actionName, handlerKey) {
    return function () {
      const operation = {
        handler: handlers[actionName][getHandlerKey(handlerKey) || _.keys(handlers[actionName])[0]]
      }
      const parser = parsers[actionName]

      if (parser) {
        operation.parse = parser
      }

      return operation
    }
  }

  return {
    getServices: new GetOperation('getServices', 'get_services_handler'),
    getService: new GetOperation('getService', 'get_service_handler'),
    updateService: new GetOperation('updateService', 'update_service_handler'),
    addService: new GetOperation('addService', 'add_service_handler'),
    getAbilities: new GetOperation('getAbilities', 'get_abilities_handler'),
    addAbility: new GetOperation('addAbility', 'add_ability_handler'),
    updateAbility: new GetOperation('updateAbility', 'update_ability_handler')
  }
}

module.exports = Mocks
