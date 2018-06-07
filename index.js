'use strict'

const Promise = require('bluebird')
const domapic = require('domapic-base')

const options = require('./lib/options')
const ServiceHandler = require('./lib/ServiceHandler')

const Service = function (serviceOptions) {
  return new domapic.Service(options.extendWith(serviceOptions)).then((service) => {
    const serviceHandler = new ServiceHandler(service)
    return Promise.all([
      serviceHandler.addConnectionApi(),
      serviceHandler.addSecurityApi(),
      serviceHandler.addSecurity()
    ]).then(() => {
      return Promise.resolve(serviceHandler.publicMethods)
    })
  })
}

module.exports = {
  Service: Service
}
