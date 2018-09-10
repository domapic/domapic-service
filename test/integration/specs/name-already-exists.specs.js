
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when service is already registered in controller with another id', function () {
  let serviceLogs
  this.timeout(10000)

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
      .then(() => testUtils.logs.combined('domapic-service'))
      .then(log => {
        serviceLogs = log
        return Promise.resolve()
      })
  })

  test.it('should have created an user in the controller', () => {
    return test.expect(serviceLogs).to.contain(`POST | 200 | http://${process.env.controller_host_name}:3000/api/auth/apikey`)
  })

  test.it('should have ensured that service was not already registered', () => {
    return test.expect(serviceLogs).to.contain(`Received Response GET | 200 | http://${process.env.controller_host_name}:3000/api/services/foo-service`)
  })

  test.it('should have printed an error, informing that service name already exists', () => {
    return test.expect(serviceLogs).to.contain(`The service name is already defined in Controller with different id`)
  })
})
