'use strict'

const Promise = require('bluebird')
const domapic = require('domapic-base')

const options = require('./lib/options')
const serviceHandlers = require('./lib/serviceHandlers')
const { SERVICE_TYPES } = require('./lib/utils')

const ServiceCreator = function (Builder, type) {
  return serviceOptions => domapic.Service(options.extendWith(serviceOptions, type))
    .then(service => {
      const serviceHandler = new Builder(service)
      return serviceHandler.init()
        .then(() => Promise.resolve(serviceHandler.publicMethods))
    })
}

const createModule = new ServiceCreator(serviceHandlers.Module, SERVICE_TYPES.MODULE)
const createPlugin = new ServiceCreator(serviceHandlers.Plugin, SERVICE_TYPES.PLUGIN)

const cli = cliOptions => domapic.cli(options.extendWith(cliOptions))

module.exports = {
  createModule,
  createPlugin,
  cli
}
