'use strict'

const _ = require('lodash')

const Abilities = require('./Abilities')
const Connection = require('./Connection')
const Security = require('./Security')
const events = require('./events')

const ServiceHandler = function (service) {
  const connection = new Connection(service)
  const abilities = new Abilities(service, connection)
  const security = new Security(service)

  const start = function () {
    return service.server.start()
      .then(() => {
        return connection.connect()
      })
  }

  const publicMethods = _.extend({
    start: start,
    ability: abilities.add
  }, events)

  return {
    addConnectionApi: connection.addApi,
    addSecurity: security.addApiKeyAuth,
    publicMethods: publicMethods
  }
}

module.exports = ServiceHandler
