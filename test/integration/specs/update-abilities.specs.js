
const test = require('narval')

const utils = require('./utils')

test.describe('when service is already registered in controller', function () {
  this.timeout(10000)

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
  })

  test.it('should have ensured that service was not already registered', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.contain(`Received Response GET | 200 | http://${process.env.controller_host_name}:3000/api/services/foo-service`)
      })
  })

  test.it('should make a request to controller api in order to update service info', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.contain(`Received Response PATCH | 200 | http://${process.env.controller_host_name}:3000/api/services/foo-service`)
      })
  })

  test.it('should ensure that abilities are not already registered', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.contain(`Send Request GET | http://${process.env.controller_host_name}:3000/api/services/foo-service/abilities`)
      })
  })

  test.it('should deprecate an ability if data field has changed, and create a new one', () => {
    return utils.readOutErr()
      .then((log) => {
        return Promise.all([
          test.expect(log).to.contain('Deprecating "command" of ability "console" in controller'),
          test.expect(log).to.contain('Creating "command" of ability "console" in controller')
        ])
      })
  })

  test.it('should update an ability if the description has changed', () => {
    return utils.readOutErr()
      .then((log) => {
        return Promise.all([
          test.expect(log).to.contain('Updating "event" of ability "console" in controller')
        ])
      })
  })
})
