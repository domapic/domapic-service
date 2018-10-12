
const test = require('narval')

const utils = require('./utils')

test.describe('when using connection api to connect with controller with wrong controller apiKey', function () {
  this.timeout(10000)
  const serviceConnection = new utils.ServiceConnection()

  test.it('should return an authentication error', () => {
    return serviceConnection.request('/connection', {
      method: 'PUT',
      body: {
        active: true,
        apiKey: 'foo-api-key',
        url: utils.CONTROLLER_URL
      }
    }).then(response => {
      return test.expect(response.statusCode).to.equal(401)
    })
  })
})
