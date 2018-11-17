'use strict'

const path = require('path')

const _ = require('lodash')
const domapic = require('../../../../index')
const options = require('./options')

const eventsToTest = {
  user: {
    created: 'A new user has been added',
    updated: 'User has been updated',
    deleted: 'User has been deleted'
  },
  service: {
    created: 'A new service has been added',
    updated: 'Service has been updated',
    deleted: 'Sser has been deleted'
  },
  ability: {
    created: 'A new ability has been added',
    updated: 'Ability has been updated',
    deleted: 'Ability has been deleted',
    action: 'Ability action has been dispatched',
    event: 'Ability event has been triggered'
  }
}

domapic.createPlugin({
  packagePath: path.resolve(__dirname),
  customConfig: options
}).then(async plugin => {
  let exampleOption = await plugin.config.get('exampleOption')
  await plugin.tracer.debug(`example option: ${exampleOption}`)
  let operationEvents = []

  _.each(eventsToTest, (eventData, entity) => {
    plugin.events.on(`${entity}:*`, data => {
      plugin.tracer.info(`Received ${entity}:* event. Operation ${data.operation}, data: ${data.data.fooData}`)
    })
    _.each(eventData, (trace, operation) => {
      if (!operationEvents.includes(operation)) {
        operationEvents.push(operation)
        plugin.events.on(`*:${operation}`, data => {
          plugin.tracer.info(`Received *:${operation} event. Entity ${data.entity}, data: ${data.data.fooData}`)
        })
      }
      plugin.events.on(`${entity}:${operation}`, data => {
        plugin.tracer.info(trace, data)
      })
    })
  })

  plugin.events.on('*', data => {
    plugin.tracer.info(`Received * event. Entity ${data.entity}, operation ${data.operation}, data: ${data.data.fooData}`)
  })

  plugin.controller.users.me()
    .catch(err => plugin.tracer.error(err.message))

  return plugin.start()
})
