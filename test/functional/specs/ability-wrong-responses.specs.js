
const test = require('narval')

const utils = require('./utils')

test.describe('when validating ability handlers responses', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  const testState = function (url, dataType, errorMessage) {
    test.it(`state should return a bad data error when ${dataType} data is required, but not returned`, () => {
      return connection.request(`/abilities/${url}/state`, {
        method: 'GET'
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(422),
          test.expect(response.body.message).to.contain('response'),
          test.expect(response.body.message).to.contain(`instance.data ${errorMessage}`)
        ])
      })
    })
  }

  const testAction = function (url, dataType, errorMessage, data) {
    test.it(`action should return a bad data error when ${dataType} data is required and response does not meet the expectative`, () => {
      return connection.request(`/abilities/${url}/action`, {
        method: 'POST',
        body: {
          data
        }
      }).then((response) => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(422),
          test.expect(response.body.message).to.contain('response'),
          test.expect(response.body.message).to.contain(`${errorMessage}`)
        ])
      })
    })
  }

  testState('boolean-console', 'boolean', 'is not of a type(s) boolean')
  testAction('boolean-console', 'boolean', 'is not of a type(s) boolean', false)

  testState('email-console', 'email', 'does not conform to the "email" format')
  testAction('email-console', 'email', 'is not of a type(s) string', 'foo@foo.com')

  testState('enum-console', 'enum', 'is not one of enum values')
  testAction('enum-console', 'enum', 'is not one of enum values', 'foo1')

  testState('numeric-console', 'number', 'is not of a type(s) number')
  testAction('numeric-console', 'number', 'must have a maximum value of 120', 70)

  testState('numeric-enum-console', 'number enum', 'is not one of enum values')
  testAction('numeric-enum-console', 'number enum', 'is not one of enum values', 30)

  testAction('no-data-console', 'no', 'Data was provided to an ability without data defined')
})
