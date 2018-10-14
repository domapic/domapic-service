
const test = require('narval')

const utils = require('./utils')

test.describe('when connection with controller failed', function () {
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('console service user should not be registered in controller', () => {
    return controllerConnection.request('/users')
      .then(response => {
        const service = response.body.find(service => service.name === 'console')
        return test.expect(service).to.be.undefined()
      })
  })

  test.it('console have no services registered in controller', () => {
    return controllerConnection.request('/services')
      .then(response => {
        return test.expect(response.body.length).to.equal(0)
      })
  })

  test.it('console no abilities registered in controller', () => {
    return controllerConnection.request('/abilities')
      .then(response => {
        return test.expect(response.body.length).to.equal(0)
      })
  })
})
