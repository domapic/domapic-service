
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using a boolean ability', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should dispatch ability action when boolean is provided', () => {
    return connection.request('/abilities/boolean-console/action', {
      method: 'POST',
      body: {
        data: true
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: true`),
                test.expect(log).to.contain(`Error sending "booleanConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return a bad data error when no boolean is provided', () => {
    return connection.request('/abilities/boolean-console/action', {
      method: 'POST',
      body: {
        data: 'foo'
      }
    }).then((response) => {
      return test.expect(response.statusCode).to.equal(422)
    })
  })

  test.it('should return ability state', () => {
    return connection.request('/abilities/boolean-console/state', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          data: true
        })
      ])
    })
  })

  test.it('should return new ability state after it has changed', () => {
    return connection.request('/abilities/boolean-console/action', {
      method: 'POST',
      body: {
        data: false
      }
    }).then(() => {
      return connection.request('/abilities/boolean-console/state', {
        method: 'GET'
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body).to.deep.equal({
            data: false
          })
        ])
      })
    })
  })
})
