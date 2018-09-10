
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when service finish connection process', function () {
  this.timeout(10000)

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
  })

  test.it('should have connected to the controller', () => {
    return testUtils.logs.combined('domapic-service')
      .then((log) => {
        return test.expect(log).to.contain(`Connection success with Domapic Controller`)
      })
  })

  test.it('should have saved the controller assigned api key into the configuration file', () => {
    return utils.readStorage('config')
      .then((config) => {
        return test.expect(config.controllerApiKey).to.equal(`foo-api-key-for-service`)
      })
  })
})
