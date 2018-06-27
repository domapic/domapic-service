
const test = require('narval')

const utils = require('./utils')

test.describe('when connection api is called and service is already registered with another id', function () {
  this.timeout(10000)

  test.it('should have responded with a server unavailable status code', () => {
    const controllerUrl = `http://${process.env.controller_host_name}:3000`
    return utils.request('/connection', {
      method: 'PUT',
      body: {
        active: true,
        url: controllerUrl,
        apiKey: 'foo-api-key'
      }
    }).then((response) => {
      return utils.waitOnestimatedStartTime(2000)
        .then(() => {
          return test.expect(response.statusCode).to.equal(503)
        })
    })
  })
})
