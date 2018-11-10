
const test = require('narval')

const utils = require('./utils')

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

  test.it('should return service information', () => {
    return connection.request('/about', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          name: 'relay-domapic-module',
          type: 'module',
          package: 'relay-domapic-module',
          description: 'Domapic module controlling a relay',
          version: '1.0.0'
        })
      ])
    })
  })
})
