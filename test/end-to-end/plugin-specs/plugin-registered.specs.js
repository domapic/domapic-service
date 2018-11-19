
const test = require('narval')

const utils = require('../specs/utils')

test.describe('when connection with controller is successful', function () {
  let serviceUserId
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('plugin user should be registered in controller', () => {
    return controllerConnection.request('/users')
      .then(response => {
        const user = response.body.find(user => user.name === 'example-plugin')
        serviceUserId = user._id
        return test.expect(user.role).to.equal('plugin')
      })
  })

  test.it('plugin should be registered in controller', () => {
    return controllerConnection.request('/services')
      .then(response => {
        const service = response.body.find(service => service.name === 'example-plugin')
        return Promise.all([
          test.expect(service._user).to.equal(serviceUserId),
          test.expect(service.package).to.equal('example-domapic-plugin'),
          test.expect(service.version).to.equal('1.0.0'),
          test.expect(service.description).to.equal('Domapic plugin for testing purposes')
        ])
      })
  })
})
