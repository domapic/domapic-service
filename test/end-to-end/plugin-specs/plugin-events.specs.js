
const test = require('narval')

const utils = require('../specs/utils')

test.describe('plugin controller interface and events', function () {
  this.timeout(20000)
  let serviceConnection
  let userId
  let consoleServiceId
  let consoleAbilityId

  const requestController = (entity, operation, options = {}) => {
    const body = {
      entity,
      operation
    }
    if (options.filter) {
      body.filter = options.filter
    }
    if (options.id) {
      body.id = options.id
    }
    if (options.data) {
      body.data = options.data
    }
    return serviceConnection.request('/controller', {
      method: 'POST',
      body
    })
  }

  test.before(() => {
    return utils.readStorage()
      .then(data => {
        return Promise.resolve(data.apiKeys.find(apiKeyData => apiKeyData.user === 'controller').key)
      })
      .then(apiKey => {
        serviceConnection = new utils.ServiceConnection(apiKey)
      })
  })

  test.describe('controller interface for getting current logged user', () => {
    test.it('should return data of plugin user', () => {
      return requestController('users', 'me').then(response => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.name).to.equal('example-plugin'),
          test.expect(response.body.role).to.equal('plugin')
        ])
      })
    })
  })

  test.describe('controller interface for creating users', () => {
    test.it('should return id of created user', () => {
      return requestController('users', 'create', {
        data: {
          name: 'foo-operator-name',
          email: 'foo-operator-email@foo-email.com',
          password: 'foo-operator-password'
        }
      }).then(response => {
        userId = response.body._id
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body._id).to.not.be.undefined()
        ])
      })
    })

    test.it('should have received an event from controller about created user', () => {
      return utils.serviceLogs()
        .then(logs => {
          return Promise.all([
            test.expect(logs).to.contain(`Received user:created event. Data: {"_id":"${userId}"`)
          ])
        })
    })
  })

  test.describe('controller interface for getting users', () => {
    test.it('should return user when passing id', () => {
      return requestController('users', 'get', {
        id: userId
      }).then(response => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body._id).to.equal(userId)
        ])
      })
    })

    test.it('should return all operator users when no passing filter', () => {
      return requestController('users', 'get').then(response => {
        const noOperator = response.body.find(user => user.role !== 'operator')
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(1),
          test.expect(noOperator).to.be.undefined()
        ])
      })
    })
  })

  test.describe('controller interface for getting services', () => {
    test.it('should return all services', () => {
      return requestController('services', 'get').then(response => {
        const plugin = response.body.find(user => user.name === 'example-plugin')
        const console = response.body.find(user => user.name === 'console-module')
        consoleServiceId = console._id
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(2),
          test.expect(plugin).to.not.be.undefined(),
          test.expect(console).to.not.be.undefined()
        ])
      })
    })
  })

  test.describe('controller interface for getting abilities', () => {
    test.it('should return all abilities', () => {
      return requestController('abilities', 'get').then(response => {
        const console = response.body.find(ability => ability._service === consoleServiceId)
        consoleAbilityId = console._id
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(1),
          test.expect(console).to.not.be.undefined()
        ])
      })
    })
  })

  test.describe('controller interface for getting ability state', () => {
    test.it('should return ability state', () => {
      return requestController('abilities', 'state', {
        id: consoleAbilityId
      }).then(response => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.data).to.equal('')
        ])
      })
    })
  })

  test.describe('when using controller interface for dispatching ability action', () => {
    test.it('should return ability action response', () => {
      return requestController('abilities', 'action', {
        id: consoleAbilityId,
        data: {
          data: 'a'
        }
      }).then(response => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200)
        ])
      })
    })

    test.it('should have received an event from controller about dispatched action', () => {
      return utils.serviceLogs(500)
        .then(logs => {
          return Promise.all([
            test.expect(logs).to.contain(`Received ability:action event. Data: {"_id":"${consoleAbilityId}","data":"a"}`)
          ])
        })
    })

    test.it('should have received an event from controller about triggered event', () => {
      return utils.serviceLogs()
        .then(logs => {
          return Promise.all([
            test.expect(logs).to.contain(`Received ability:event event. Data: {"_id":"${consoleAbilityId}","data":"a"}`)
          ])
        })
    })

    test.it('should have changed ability state', () => {
      return requestController('abilities', 'state', {
        id: consoleAbilityId
      }).then(response => {
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.data).to.equal('a')
        ])
      })
    })
  })

  test.describe('controller interface for getting logs', () => {
    test.it('should return logs', () => {
      return requestController('logs', 'get').then(response => {
        const action = response.body.find(log => log.type === 'action')
        const event = response.body.find(log => log.type === 'event')
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(2),
          test.expect(action.data).to.equal('a'),
          test.expect(event.data).to.equal('a'),
          test.expect(event._ability).to.equal(consoleAbilityId),
          test.expect(action._ability).to.equal(consoleAbilityId)
        ])
      })
    })
  })
})
