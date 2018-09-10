
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('a domapic service', () => {
  test.describe('when started', () => {
    test.before(() => {
      return utils.waitOnestimatedStartTime()
    })

    test.describe('when no controller is provided', () => {
      test.it('should print an api key valid to launch a pairing command from controller', () => {
        return testUtils.logs.combined('domapic-service')
          .then((log) => {
            return test.expect(log).to.contain('Try adding connection from Controller, using the next service Api Key')
          })
      })
    })
  })
})
