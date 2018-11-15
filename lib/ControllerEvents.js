'use strict'

const eventsApi = require('./api/events.json')

const ControllerEvents = function (service, connection) {
  const eventsHandler = function (params, body, res, user) {
    console.log(body)
    return Promise.resolve()
  }

  const addApi = function () {
    return service.server.extendOpenApi(eventsApi)
      .then(() => {
        return service.server.addOperations({
          events: {
            handler: eventsHandler
          }
        })
      })
  }

  return {
    addApi
  }
}

module.exports = ControllerEvents
