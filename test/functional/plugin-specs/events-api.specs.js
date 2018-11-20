
const test = require('narval')

const _ = require('lodash')

const utils = require('../specs/utils')

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

test.describe('events api', function () {
  this.timeout(10000)
  let connection

  test.before(() => utils.waitOnestimatedStartTime(2000)
    .then(() => {
      connection = new utils.Connection()
      return Promise.resolve()
    })
  )

  _.each(eventsToTest, (eventData, entity) => {
    _.each(eventData, (trace, operation) => {
      test.it(`should emit "${entity}:${operation}", "*:${operation}" and "${entity}:*" events when entity is "${entity}" and operation is "${operation}"`, () => {
        const fooData = `Data: ${entity}:${operation}`
        const globalEvent = `Received * event. Entity ${entity}, operation ${operation}, data: ${fooData}`
        const entityEvent = `Received ${entity}:* event. Operation ${operation}, data: ${fooData}`
        const operationEvent = `Received *:${operation} event. Entity ${entity}, data: ${fooData}`

        return connection.request('/events', {
          method: 'POST',
          body: {
            entity,
            operation,
            data: {
              fooData
            }
          }
        }).then(response => {
          return utils.serviceLogs().then(logs => {
            return Promise.all([
              test.expect(response.statusCode).to.equal(201),
              test.expect(logs).to.include(trace),
              test.expect(logs).to.include(fooData),
              test.expect(logs).to.include(globalEvent),
              test.expect(logs).to.include(entityEvent),
              test.expect(logs).to.include(operationEvent)
            ])
          })
        })
      })
    })
  })
})
