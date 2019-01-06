
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using a numeric ability with decimals', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should dispatch ability action when a valid number is provided', () => {
    return connection.request('/abilities/numeric-decimal-console/action', {
      method: 'POST',
      body: {
        data: 20.5
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: 20.5`),
                test.expect(log).to.contain(`Error sending "numericDecimalConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })
})
