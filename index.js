'use strict'

const Promise = require('bluebird')
const microService = require('domapic-microservice')

const options = require('./lib/options')
const ServiceHandler = require('./lib/ServiceHandler')

const Service = function (serviceOptions) {
  return new microService.Service(options.extendWith(serviceOptions)).then((service) => {
    const serviceHandler = new ServiceHandler(service)
    return Promise.all([
      serviceHandler.addConnectionApi(),
      serviceHandler.addSecurity()
    ]).then(() => {
      return Promise.resolve(serviceHandler.publicMethods)
    })
  })
}

module.exports = Service
