
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when module name is already defined in controller', function () {
  this.timeout(10000)

  test.it('should log a connection error', () => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        return testUtils.logs.combined('service')
          .then((log) => {
            return test.expect(log).to.contain(`Error connecting to Controller: The service name is already defined in Controller with different id`)
          })
      })
  })

  test.it('should log an api key to launch connection from controller', () => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        return testUtils.logs.combined('service')
          .then((log) => {
            return test.expect(log).to.contain(`Try adding connection from Controller, using the next service Api Key`)
          })
      })
  })
})
