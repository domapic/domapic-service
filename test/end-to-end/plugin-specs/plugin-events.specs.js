
const test = require('narval')

const utils = require('../specs/utils')

test.describe('plugin controller interface and events', function () {
  this.timeout(10000)
  let serviceConnection

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
})
