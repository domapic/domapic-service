
const test = require('narval')

const utils = require('../specs/utils')

test.describe('interface to controller api', function () {
  test.it(`should trace an error when plugin is not connected to controller`, () => {
    return utils.serviceLogs().then(logs => {
      return Promise.all([
        test.expect(logs).to.include('Controller api interface not available. The service is not connected')
      ])
    })
  })
})
