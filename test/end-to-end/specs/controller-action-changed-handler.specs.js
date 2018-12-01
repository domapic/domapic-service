
const _ = require('lodash')
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using controller action api to dispatch module action', function () {
  let consoleAbilityId
  this.timeout(10000)
  const controllerConnection = new utils.ControllerConnection()

  test.before(() => {
    return controllerConnection.request('/abilities')
      .then(response => {
        const ability = response.body.find(ability => ability.name === 'stdout')
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

  test.it('should print into console the requested data', () => {
    const fooConsoleData = {
      data: 4
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
      data: _.random(2, 4)
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
            return Promise.all([
              test.expect(logsResponse.statusCode).to.equal(200),
              test.expect(actionLog).to.not.be.undefined()
            ])
          })
        })
    })
  })
})
