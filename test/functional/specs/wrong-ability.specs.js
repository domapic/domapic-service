
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('registering a wrong ability', function () {
  this.timeout(10000)

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
  })

  test.it('should throw an error', () => {
    return testUtils.logs.combined('domapic-service')
      .then((log) => {
        return test.expect(log).to.contain(`Ability "console" has an invalid format: Must have at least an state, action or event to be registered`)
      })
  })
})
