
const test = require('narval')

const utils = require('../specs/utils')

test.describe('about api', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should return plugin information', () => {
    return connection.request('/about', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          name: 'foo-service',
          type: 'plugin',
          package: 'example-domapic-plugin',
          description: 'Domapic plugin for testing purposes',
          version: '1.0.0'
        })
      ])
    })
  })
})
