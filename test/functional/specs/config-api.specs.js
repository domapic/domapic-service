const path = require('path')
const test = require('narval')

const utils = require('./utils')

test.describe('config api', function () {
  this.timeout(10000)
  let connection

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => {
        connection = new utils.Connection()
        return Promise.resolve()
      })
  })

  test.it('should return module configuration', () => {
    return connection.request('/config', {
      method: 'GET'
    }).then((response) => {
      return Promise.all([
        test.expect(response.statusCode).to.equal(200),
        test.expect(response.body).to.deep.equal({
          color: true,
          logLevel: 'info',
          port: parseInt(utils.SERVICE_PORT, 10),
          initialStatus: true,
          authDisabled: [],
          auth: true,
          hostName: utils.SERVICE_HOST,
          path: path.resolve(__dirname, '..', '..', '..', utils.DOMAPIC_PATH),
          rejectUntrusted: false,
          controllerApiKey: 'foo'
        })
      ])
    })
  })
})
