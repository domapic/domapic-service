
const test = require('narval')

const utils = require('./utils')

test.describe('when connection with controller is successful', function () {
  let serviceUserId
  let serviceId
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('console service user should be registered in controller', () => {
    return controllerConnection.request('/users')
      .then(response => {
        const service = response.body.find(service => service.name === 'console')
        serviceUserId = service._id
        return test.expect(service.role).to.equal('service')
      })
  })

  test.it('console service should be registered in controller', () => {
    return controllerConnection.request('/services')
      .then(response => {
        const service = response.body.find(service => service.name === 'console')
        serviceId = service._id
        return Promise.all([
          test.expect(service._user).to.equal(serviceUserId),
          test.expect(service.package).to.equal('handle-console-domapic-2'),
          test.expect(service.version).to.equal('2.0.0'),
          test.expect(service.description).to.equal('Example of Node.js Domapic service with changed properties')
        ])
      })
  })

  test.it('console ability should be registered in controller', () => {
    return controllerConnection.request('/abilities')
      .then(response => {
        const ability = response.body.find(ability => ability.name === 'console')
        return Promise.all([
          test.expect(ability._service).to.equal(serviceId),
          test.expect(ability._user).to.equal(serviceUserId),
          test.expect(ability.event).to.equal(true),
          test.expect(ability.action).to.equal(true),
          test.expect(ability.state).to.equal(true),
          test.expect(ability.description).to.equal('Handle console log version 2'),
          test.expect(ability.type).to.equal('string'),
          test.expect(ability.maxLength).to.equal(1)
          // TODO, expose this fields in controller
          // test.expect(ability.actionDescription).to.equal('Print the received character into console 2'),
          // test.expect(ability.stateDescription).to.equal('Last character printed in console 2'),
          // test.expect(ability.eventDescription).to.equal('Console has just printed a character 2')
        ])
      })
  })
})
