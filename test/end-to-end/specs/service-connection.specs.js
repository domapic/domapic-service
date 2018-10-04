
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when service starts and connection options are provided', function () {
  this.timeout(10000)

  test.it('should have connected to the controller', () => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        return testUtils.logs.combined('service')
          .then((log) => {
            return test.expect(log).to.contain(`Connection success with Domapic Controller at ${utils.CONTROLLER_URL}`)
          })
      })
  })
})
