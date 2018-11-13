
const test = require('narval')

const utils = require('../specs/utils')

test.describe('when connection with controller is successful', function () {
  let serviceUserId
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('plugin user should not be registered in controller', () => {
    return controllerConnection.request('/users')
      .then(response => {
        const user = response.body.find(user => user.name === 'example-plugin')
        return test.expect(user).to.be.undefined()
      })
  })

  test.it('plugin have no services registered in controller', () => {
    return controllerConnection.request('/services')
      .then(response => {
        return test.expect(response.body.length).to.equal(0)
      })
  })
})
