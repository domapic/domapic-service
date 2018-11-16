'use strict'

const events = require('./events')
const eventsApi = require('./api/events.json')

const ControllerEvents = function (service, connection) {
  const eventsHandler = function (params, body, res, user) {
    events.emit(`${body.entity}:${body.operation}`, body.data)
    events.emit('*', body)
    events.emit(`${body.entity}:*`, {
      operation: body.operation,
      data: body.data
    })
    events.emit(`*:${body.operation}`, {
      entity: body.entity,
      data: body.data
    })
    res.status(201)
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
