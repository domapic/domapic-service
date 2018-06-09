'use strict'

const path = require('path')

const domapic = require('domapic-base')

const servicesApi = require('./api/services.json')
const mocks = require('./api/mocks.js')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  return service.server.extendOpenApi(servicesApi)
    .then(() => {
      return service.server.addOperations({
        getServices: {
          handler: () => {
            return Promise.resolve(mocks.services)
          }
        },
        getService: {
          handler: () => {
            return Promise.resolve(mocks.service)
            // return Promise.reject(new Error())
          }
        },
        addService: {
          handler: (params, body, res) => {
            res.status(201)
            res.header('location', '/services/example')
            return Promise.resolve({
              apiKey: 'customApiKeyForService2'
            })
            // return Promise.reject(new service.errors.NotFound('Testing not found'))
          }
        },
        patchService: {
          handler: (params, body, res) => {
            return Promise.resolve(mocks.service)
          }
        },
        consoleEvent: {
          handler: (params, body, res) => {
            res.status(201)
            res.header('location', '/services/example/events/312q34')
            return Promise.resolve()
          }
        }
      })
    })
    .then(service.server.start)
})
