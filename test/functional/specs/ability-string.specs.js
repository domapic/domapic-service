
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when using an string ability', function () {
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
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'foo@foo.com'
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(100)
        .then(() => {
          return testUtils.logs.combined('domapic-service')
            .then((log) => {
              return Promise.all([
                test.expect(response.statusCode).to.equal(200),
                test.expect(log).to.contain(`Console Called: foo@foo.com`),
                test.expect(log).to.contain(`Error sending "emailConsole" event: The service is not connected to Controller`)
              ])
            })
        })
    })
  })

  test.it('should return a bad data error when string format is not valid', () => {
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'foo2323'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('does not conform to the "email" format')
      ])
    })
  })

  test.it('should return a bad data error when string maxLength is not valid', () => {
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'foo@foo123434234234234234234foo.com'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('does not meet maximum length of 15')
      ])
    })
  })

  test.it('should return a bad data error when string maxLength is not valid', () => {
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'foo@foo123434234234234234234foo.com'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('does not meet maximum length of 15')
      ])
    })
  })

  test.it('should return a bad data error when string minLength is not valid', () => {
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'foo@fo.com'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('does not meet minimum length of 11')
      ])
    })
  })

  test.it('should return a bad data error when string does not match pattern', () => {
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'aaa@foo.com'
      }
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(422),
        test.expect(response.body.message).to.contain('does not match pattern')
      ])
    })
  })

  test.it('should return ability state', () => {
    return connection.request('/abilities/email-console/state', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          data: 'foo@foo.com'
        })
      ])
    })
  })

  test.it('should return new ability state after it has changed', () => {
    return connection.request('/abilities/email-console/action', {
      method: 'POST',
      body: {
        data: 'foo2@fo4e3o.com'
      }
    }).then(() => {
      return connection.request('/abilities/email-console/state', {
        method: 'GET'
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body).to.deep.equal({
            data: 'foo2@fo4e3o.com'
          })
        ])
      })
    })
  })
})
