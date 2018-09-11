
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when service is already registered in controller', function () {
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

  test.it('should make a request to controller api in order to update service info', () => {
    return test.expect(serviceLogs).to.contain(`Received Response PATCH | 200 | http://${process.env.controller_host_name}:3000/api/services/foo-service`)
  })

  test.it('should ensure that abilities are not already registered', () => {
    return test.expect(serviceLogs).to.contain(`Send Request GET | http://${process.env.controller_host_name}:3000/api/services/foo-service/abilities`)
  })

  test.it('should deprecate an ability if data field has changed, and create a new one', () => {
    return Promise.all([
      test.expect(serviceLogs).to.contain('Deprecating "action" of ability "console" in controller'),
      test.expect(serviceLogs).to.contain('Creating "action" of ability "console" in controller')
    ])
  })

  test.it('should update an ability if the description has changed', () => {
    return test.expect(serviceLogs).to.contain('Updating "event" of ability "console" in controller')
  })
})
