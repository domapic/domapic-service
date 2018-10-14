
const test = require('narval')

const utils = require('./utils')

test.describe('when using connection api to connect with controller', function () {
  let controllerApiKey
  this.timeout(10000)

  test.beforeEach(() => {
    return utils.getControllerApiKey()
      .then(apiKey => {
        controllerApiKey = apiKey
        return Promise.resolve()
      })
  })
  const serviceConnection = new utils.ServiceConnection()

  test.it('should return response with current connection data', () => {
    return serviceConnection.request('/connection', {
      method: 'PUT',
      body: {
        active: true,
        apiKey: controllerApiKey,
        url: utils.CONTROLLER_URL
      }
    }).then(response => {
      return test.expect(response.body).to.deep.equal({
        active: true,
        apiKey: controllerApiKey,
        url: utils.CONTROLLER_URL
      })
    })
  })
})
