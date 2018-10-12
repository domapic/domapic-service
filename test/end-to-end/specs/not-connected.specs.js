
const test = require('narval')
const testUtils = require('narval/utils')

test.describe('when service finish connection process', function () {
  this.timeout(10000)

  test.it('should have not connected to the controller', () => {
    return testUtils.logs.combined('service')
      .then((log) => {
        return test.expect(log).to.not.contain(`Connection success with Domapic Controller`)
      })
  })
})
