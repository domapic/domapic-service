
const _ = require('lodash')
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

const randomChar = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const pos = _.random(0, chars.length - 1)
  return chars.substring(pos, pos + 1)
}

test.describe('when using controller action api to dispatch ability action', function () {
  let consoleAbilityId
  this.timeout(10000)
  const controllerConnection = new utils.ControllerConnection()

  test.before(() => {
    return controllerConnection.request('/abilities')
      .then(response => {
        const ability = response.body.find(ability => ability.name === 'console')
        consoleAbilityId = ability._id
        return Promise.resolve()
      })
  })

  test.it('should reject the request if data is invalid', () => {
    const fooConsoleData = {
      data: 53
    }
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: fooConsoleData
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(422),
                test.expect(log).to.not.contain('Printing into console:')
              ])
            })
        })
    })
  })

  test.it('should print into console the requested data', () => {
    const fooConsoleData = {
      data: 'x'
    }
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: fooConsoleData
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(201),
                test.expect(log).to.contain(`Printing into console: ${fooConsoleData.data}`)
              ])
            })
        })
    })
  })

  test.it('should trigger related event, and it should be saved into controller database', () => {
    const fooConsoleData = {
      data: randomChar()
    }
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: fooConsoleData
    }).then(response => {
      return utils.waitOnestimatedStartTime(200)
        .then(() => {
          return controllerConnection.request(`/logs`, {
            method: 'GET'
          }).then(logsResponse => {
            const actionLog = logsResponse.body.find(log => log.data === fooConsoleData.data && log.type === 'action')
            const eventLog = logsResponse.body.find(log => log.data === fooConsoleData.data && log.type === 'event')
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

test.describe('when using controller action api to dispatch ability action with no data', function () {
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

  test.it('should reject the request if data is invalid', () => {
    const fooConsoleData = {
      data: 53
    }
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: fooConsoleData
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
                test.expect(log).to.contain(`Received action with no data`)
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
              test.expect(eventLog).to.not.be.undefined(),
              test.expect(actionLog.data).to.be.undefined(),
              test.expect(eventLog.data).to.be.undefined()
            ])
          })
        })
    })
  })
})

test.describe('when using controller action api to dispatch ability action with numeric data', function () {
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
    const fooConsoleData = {
      data: 15
    }
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: fooConsoleData
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

  test.it('should print into console a log when data is numeric', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: {
        data: 3
      }
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(201),
                test.expect(log).to.contain(`Printing into console: 3`)
              ])
            })
        })
    })
  })

  test.it('should trigger related event, and it should be saved into controller database', () => {
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: {
        data: 2
      }
    }).then(response => {
      return utils.waitOnestimatedStartTime(200)
        .then(() => {
          return controllerConnection.request(`/logs`, {
            method: 'GET'
          }).then(logsResponse => {
            const actionLog = logsResponse.body.find(log => log._ability === consoleAbilityId && log.data === 2 && log.type === 'action')
            const eventLog = logsResponse.body.find(log => log._ability === consoleAbilityId && log.data === 2 && log.type === 'event')
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
