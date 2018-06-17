
const test = require('narval')

const utils = require('./utils')

test.describe('when service finish connection process', function () {
  this.timeout(10000)

  test.before(() => {
    return utils.waitOnestimatedStartTime(2000)
  })

  test.it('should have not connected to the controller', () => {
    return utils.readOutErr()
      .then((log) => {
        return test.expect(log).to.not.contain(`Connection success with Domapic Controller`)
      })
  })
})
