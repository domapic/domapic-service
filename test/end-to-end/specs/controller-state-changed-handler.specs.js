
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using controller state api to get service ability state', function () {
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

  test.it('should return the ability state', () => {
    const fooConsoleData = {
      data: 3
    }
    return controllerConnection.request(`/abilities/${consoleAbilityId}/action`, {
      method: 'POST',
      body: fooConsoleData
    }).then(response => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('service')
            .then((log) => {
              return controllerConnection.request(`/abilities/${consoleAbilityId}/state`, {
                method: 'GET'
              }).then(stateResponse => {
                return Promise.all([
                  test.expect(response.statusCode).to.equal(201),
                  test.expect(log).to.contain(`Printing into console: ${fooConsoleData.data}`),
                  test.expect(stateResponse.statusCode).to.equal(200),
                  test.expect(stateResponse.body).to.deep.equal(fooConsoleData)
                ])
              })
            })
        })
    })
  })
})
