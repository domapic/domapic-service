
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using controller action api to dispatch service action', function () {
  let consoleAbilityId
  let serviceId
  this.timeout(10000)
  const controllerConnection = new utils.ControllerConnection()

  test.before(() => {
    return controllerConnection.request('/services')
      .then(response => {
        const service = response.body.find(service => service.name === 'console')
        serviceId = service._id
         return controllerConnection.request('/abilities')
          .then(response => {
            const ability = response.body.find(ability => ability.name === 'console')
            consoleAbilityId = ability._id
            return Promise.resolve();
          })
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
})
