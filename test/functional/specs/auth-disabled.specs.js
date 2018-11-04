
const PromiseB = require('bluebird')
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('abilities with auth disabled', () => {
  let connection

  test.beforeEach(() => {
    connection = new utils.Connection()
  })

  test.describe('when using api key', () => {
    test.it('should dispatch ability action', () => {
      return connection.request('/abilities/console/action', {
        method: 'POST',
        body: {
          data: true
        }
      }).then((response) => {
        return utils.waitOnestimatedStartTime(100)
          .then(() => {
            return testUtils.logs.combined('domapic-service')
              .then((log) => {
                return PromiseB.all([
                  test.expect(response.statusCode).to.equal(200),
                  test.expect(log).to.contain(`Console Called: true`)
                ])
              })
          })
      })
    })

    test.it('should return ability state', () => {
      return connection.request('/abilities/console/state', {
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
      return connection.request('/abilities/console/action', {
        method: 'POST',
        body: {
          data: false
        }
      }).then(() => {
        return connection.request('/abilities/console/state', {
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

  test.describe('when no using api key', () => {
    test.it('should dispatch ability action', () => {
      return utils.request('/abilities/console/action', {
        method: 'POST',
        body: {
          data: true
        }
      }).then((response) => {
        return utils.waitOnestimatedStartTime(100)
          .then(() => {
            return testUtils.logs.combined('domapic-service')
              .then((log) => {
                return PromiseB.all([
                  test.expect(response.statusCode).to.equal(200),
                  test.expect(log).to.contain(`Console Called: true`)
                ])
              })
          })
      })
    })

    test.it('should return ability state', () => {
      return connection.request('/abilities/console/state', {
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
      return connection.request('/abilities/console/action', {
        method: 'POST',
        body: {
          data: false
        }
      }).then(() => {
        return connection.request('/abilities/console/state', {
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
})
