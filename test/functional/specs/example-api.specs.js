
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when starting module from documentation example', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should return switch state', () => {
    return connection.request('/abilities/switch/state', {
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

  test.it('should return a bad data error when dispatchin action with non boolean value', () => {
    return connection.request('/abilities/switch/action', {
      method: 'POST',
      body: {
        data: 'foo'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('is not of a type(s) boolean')
      ])
    })
  })

  test.it('should dispatch ability action when a boolean is provided', () => {
    return connection.request('/abilities/switch/action', {
      method: 'POST',
      body: {
        data: false
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Error sending "switch" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return new switch state', () => {
    return connection.request('/abilities/switch/state', {
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
