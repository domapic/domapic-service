
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using a numeric ability', function () {
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
    return connection.request('/abilities/numeric-console/action', {
      method: 'POST',
      body: {
        data: 60
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: 60`),
                test.expect(log).to.contain(`Error sending "numericConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return a bad data error when number does not meet multipleOf', () => {
    return connection.request('/abilities/numeric-console/action', {
      method: 'POST',
      body: {
        data: 75
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('is not a multiple of (divisible by) 10')
      ])
    })
  })

  test.it('should return a bad data error when number does not meet minimum', () => {
    return connection.request('/abilities/numeric-console/action', {
      method: 'POST',
      body: {
        data: 50
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('must have a minimum value of 60')
      ])
    })
  })

  test.it('should return a bad data error when number does not meet maximum', () => {
    return connection.request('/abilities/numeric-console/action', {
      method: 'POST',
      body: {
        data: 130
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('must have a maximum value of 120')
      ])
    })
  })

  test.it('should return ability state', () => {
    return connection.request('/abilities/numeric-console/state', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          data: 60
        })
      ])
    })
  })

  test.it('should return new ability state after it has changed', () => {
    return connection.request('/abilities/numeric-console/action', {
      method: 'POST',
      body: {
        data: 120
      }
    }).then(() => {
      return connection.request('/abilities/numeric-console/state', {
        method: 'GET'
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body).to.deep.equal({
            data: 120
          })
        ])
      })
    })
  })
})
