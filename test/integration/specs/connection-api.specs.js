
const test = require('narval')

const utils = require('./utils')

test.describe('when connection api is called', function () {
  this.timeout(10000)

  test.it('should have connected to the controller', () => {
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
          return utils.readOutErr()
            .then((log) => {
              return Promise.all([
                test.expect(log).to.contain(`Connection success with Domapic Controller at ${controllerUrl}`),
                test.expect(response.statusCode).to.equal(200)
              ])
            })
        })
    })
  })
})
