
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when connection with controller was successful', function () {
  let serviceUserId
  let serviceId
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('console module user should be registered in controller', () => {
    return controllerConnection.request('/users')
      .then(response => {
        const service = response.body.find(service => service.name === 'console')
        serviceUserId = service._id
        return test.expect(service.role).to.equal('module')
      })
  })

  test.it('console module should be registered in controller', () => {
    return controllerConnection.request('/services')
      .then(response => {
        const service = response.body.find(service => service.name === 'console')
        serviceId = service._id
        return Promise.all([
          test.expect(service._user).to.equal(serviceUserId),
          test.expect(service.package).to.equal('handle-stdout-domapic'),
          test.expect(service.version).to.equal('1.0.0'),
          test.expect(service.description).to.equal('Example of Node.js Domapic module with another ability')
        ])
      })
  })

  test.it('console ability should be registered in controller', () => {
    return controllerConnection.request('/abilities')
      .then(response => {
        const ability = response.body.find(ability => ability.name === 'stdout')
        return Promise.all([
          test.expect(response.body.length).to.equal(3),
          test.expect(ability._service).to.equal(serviceId),
          test.expect(ability._user).to.equal(serviceUserId),
          test.expect(ability.event).to.equal(false),
          test.expect(ability.action).to.equal(true),
          test.expect(ability.state).to.equal(true),
          test.expect(ability.description).to.equal('Handle stdout'),
          test.expect(ability.type).to.equal('number'),
          test.expect(ability.maximum).to.equal(5),
          test.expect(ability.minimum).to.equal(2),
          test.expect(ability.actionDescription).to.equal('Print the received character into stdout'),
          test.expect(ability.stateDescription).to.equal('Last character printed in stdout'),
          test.expect(ability.eventDescription).to.equal(undefined)
        ])
      })
  })
})

test.describe('when using controller action api to dispatch ability that previously has no data', function () {
  let consoleAbilityId
  this.timeout(10000)
  const controllerConnection = new utils.ControllerConnection()

  test.before(() => {
    return controllerConnection.request('/abilities')
      .then(response => {
        const ability = response.body.find(ability => ability.name === 'consoleNoData')
        consoleAbilityId = ability._id
        return Promise.resolve()
      })
  })

  test.it('should reject the request if no data is received', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST'
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(422)
              ])
            })
        })
    })
  })

  test.it('should print into console a log when right data is received', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: {
        data: 5
      }
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(201),
                test.expect(log).to.contain(`Printing into console: 5`)
              ])
            })
        })
    })
  })

  test.it('should trigger related event, and it should be saved into controller database', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: {
        data: 6
      }
    }).then(response => {
      return utils.waitOnestimatedStartTime(200)
        .then(() => {
          return controllerConnection.request(`/logs`, {
            method: 'GET'
          }).then(logsResponse => {
            const actionLog = logsResponse.body.find(log => log._ability === consoleAbilityId && log.data === 6 && log.type === 'action')
            const eventLog = logsResponse.body.find(log => log._ability === consoleAbilityId && log.data === 6 && log.type === 'event')
            return Promise.all([
              test.expect(logsResponse.statusCode).to.equal(200),
              test.expect(actionLog).to.not.be.undefined(),
              test.expect(eventLog).to.not.be.undefined()
            ])
          })
        })
    })
  })
})

test.describe('when using controller action api to dispatch ability action with numeric data before, but now has not data', function () {
  let consoleAbilityId
  this.timeout(10000)
  const controllerConnection = new utils.ControllerConnection()

  test.before(() => {
    return controllerConnection.request('/abilities')
      .then(response => {
        const ability = response.body.find(ability => ability.name === 'consoleNumeric')
        consoleAbilityId = ability._id
        return Promise.resolve()
      })
  })

  test.it('should reject the request if data is invalid', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: {
        data: 'foo'
      }
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(422)
              ])
            })
        })
    })
  })

  test.it('should print into console a log when no data is received', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST'
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(201),
                test.expect(log).to.contain(`Printing consoleNumeric with no data`)
              ])
            })
        })
    })
  })

  test.it('should trigger related event, and it should be saved into controller database', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST'
    }).then(response => {
      return utils.waitOnestimatedStartTime(200)
        .then(() => {
          return controllerConnection.request(`/logs`, {
            method: 'GET'
          }).then(logsResponse => {
            const actionLog = logsResponse.body.find(log => log._ability === consoleAbilityId && log.type === 'action')
            const eventLog = logsResponse.body.find(log => log._ability === consoleAbilityId && log.type === 'event')
            return Promise.all([
              test.expect(logsResponse.statusCode).to.equal(200),
              test.expect(actionLog).to.not.be.undefined(),
              test.expect(eventLog).to.not.be.undefined()
            ])
          })
        })
    })
  })
})
