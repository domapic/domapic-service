
const test = require('narval')

const utils = require('./utils')

test.describe('when service is already registered in controller with another id', function () {
  this.timeout(10000)

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
  })

  test.it('should have created an user in the controller', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.contain(`POST | 200 | http://${process.env.controller_host_name}:3000/api/auth/apikey`)
      })
  })

  test.it('should have ensured that service was not already registered', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.contain(`Received Response GET | 200 | http://${process.env.controller_host_name}:3000/api/services/foo-service`)
      })
  })

  test.it('should have printed an error, informing that service name already exists', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.contain(`The service name is already defined in Controller with different id`)
      })
  })
})
