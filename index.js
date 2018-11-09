'use strict'

const Promise = require('bluebird')
const domapic = require('domapic-base')

const options = require('./lib/options')
const ServiceHandler = require('./lib/ServiceHandler')

const createModule = moduleOptions => new domapic.Service(options.extendWith(moduleOptions))
  .then(service => {
    const serviceHandler = new ServiceHandler(service)
    return Promise.all([
      serviceHandler.addConnectionApi(),
      serviceHandler.addSecurityApi(),
      serviceHandler.addSecurity()
    ]).then(() => Promise.resolve(serviceHandler.publicMethods))
  })

module.exports = {
  createModule,
  cli: domapic.cli
}
