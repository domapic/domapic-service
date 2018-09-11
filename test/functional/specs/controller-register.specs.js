
const test = require('narval')
const testUtils = require('narval/utils')

const utils = require('./utils')

test.describe('when controller url is provided', function () {
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
    return test.expect(serviceLogs).to.contain(`Received Response GET | 404 | http://${process.env.controller_host_name}:3000/api/services/foo-service`)
  })

  test.it('should make a request to controller api to register itself', () => {
    return test.expect(serviceLogs).to.contain(`Received Response POST | 201 | http://${process.env.controller_host_name}:3000/api/services`)
  })

  test.it('should ensure that abilities are not already registered', () => {
    return test.expect(serviceLogs).to.contain(`Send Request GET | http://${process.env.controller_host_name}:3000/api/services/foo-service/abilities`)
  })

  test.it('should register all abilities in the controller', () => {
    return Promise.all([
      test.expect(serviceLogs).to.contain('Creating "state" of ability "console" in controller'),
      test.expect(serviceLogs).to.contain('Creating "action" of ability "console" in controller'),
      test.expect(serviceLogs).to.contain('Creating "event" of ability "console" in controller')
    ])
  })
})
