
const test = require('narval')

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
          data: false
        })
      ])
    })
  })
})
