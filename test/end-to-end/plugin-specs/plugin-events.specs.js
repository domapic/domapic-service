
const test = require('narval')

const utils = require('../specs/utils')

test.describe('plugin controller interface and events', function () {
  this.timeout(10000)
  let serviceConnection
  let userId

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
})
