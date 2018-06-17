'use strict'

const path = require('path')

const _ = require('lodash')
const domapic = require('domapic-base')

const servicesApi = require('./api/services.json')
const Mocks = require('./api/mocks.js')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  const mocks = new Mocks(service)
  return service.server.extendOpenApi(servicesApi)
    .then(() => {
      let operationsToAdd = {}
      _.each(mocks, (getHandler, mockName) => {
        operationsToAdd[mockName] = getHandler()
      })
      return service.server.addOperations(operationsToAdd)
    })
    .then(service.server.start)
})
