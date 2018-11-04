
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using a numeric ability with a defined enum', function () {
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
    return connection.request('/abilities/numeric-enum-console/action', {
      method: 'POST',
      body: {
        data: 20
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: 20`),
                test.expect(log).to.contain(`Error sending "numericEnumConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return a bad data error when number is not one from enum', () => {
    return connection.request('/abilities/numeric-enum-console/action', {
      method: 'POST',
      body: {
        data: 35
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('is not one of enum values')
      ])
    })
  })

  test.it('should return a bad data error when number does not meet the exclusiveMinimum validation', () => {
    return connection.request('/abilities/numeric-enum-console/action', {
      method: 'POST',
      body: {
        data: 10
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('must have a minimum value of 10')
      ])
    })
  })

  test.it('should return a bad data error when number does not meet the exclusiveMaximum validation', () => {
    return connection.request('/abilities/numeric-enum-console/action', {
      method: 'POST',
      body: {
        data: 40
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('must have a maximum value of 40')
      ])
    })
  })

  test.it('should return ability state', () => {
    return connection.request('/abilities/numeric-enum-console/state', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          data: 20
        })
      ])
    })
  })

  test.it('should return new ability state after it has changed', () => {
    return connection.request('/abilities/numeric-enum-console/action', {
      method: 'POST',
      body: {
        data: 30
      }
    }).then(() => {
      return connection.request('/abilities/numeric-enum-console/state', {
        method: 'GET'
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body).to.deep.equal({
            data: 30
          })
        ])
      })
    })
  })
})
