
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using an ability without data', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should dispatch ability action', () => {
    return connection.request('/abilities/no-data-console/action', {
      method: 'POST'
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: undefined`),
                test.expect(log).to.contain(`Error sending "noDataConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return a bad data error when data is provided', () => {
    return connection.request('/abilities/no-data-console/action', {
      method: 'POST',
      body: {
        data: 'foo2323'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('additionalProperty "data" exists in instance when not allowed')
      ])
    })
  })

  test.it('should not send event when trying to send data', () => {
    return connection.request('/abilities/no-data-wrong-console/action', {
      method: 'POST'
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: hello`),
                test.expect(log).to.contain(`Invalid data in event response "noDataWrongConsole": Data was provided to an ability without data defined`)
              ])
            })
        })
    })
  })
})
