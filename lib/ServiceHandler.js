'use strict'

const _ = require('lodash')

const Abilities = require('./Abilities')
const Api = require('./Api')
const Security = require('./Security')
const events = require('./events')

const ServiceHandler = function (service) {
  const api = new Api(service)
  const abilities = new Abilities(service, api)
  const security = new Security(service)

  const start = function () {
    return service.server.start()
      .then(() => {
        return service.tracer.info('SERVICE STARTED!!!')
      })
  }

  const publicMethods = _.extend({
    start: start,
    ability: abilities.add
  }, events)

  return {
    addBaseApi: api.addBase,
    addSecurity: security.addApiKeyAuth,
    publicMethods: publicMethods
  }
}

module.exports = ServiceHandler
