
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using an string ability with a defined enum', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should dispatch ability action when a valid string is provided', () => {
    return connection.request('/abilities/enum-console/action', {
      method: 'POST',
      body: {
        data: 'foo1'
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: foo1`),
                test.expect(log).to.contain(`Error sending "enumConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return a bad data error when string is not one from enum', () => {
    return connection.request('/abilities/enum-console/action', {
      method: 'POST',
      body: {
        data: 'asddas'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('is not one of enum values')
      ])
    })
  })

  test.it('should return ability state', () => {
    return connection.request('/abilities/enum-console/state', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          data: 'foo1'
        })
      ])
    })
  })

  test.it('should return new ability state after it has changed', () => {
    return connection.request('/abilities/enum-console/action', {
      method: 'POST',
      body: {
        data: 'foo2'
      }
    }).then(() => {
      return connection.request('/abilities/enum-console/state', {
        method: 'GET'
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body).to.deep.equal({
            data: 'foo2'
          })
        ])
      })
    })
  })
})
