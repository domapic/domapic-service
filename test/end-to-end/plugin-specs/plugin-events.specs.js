
const test = require('narval')

const utils = require('../specs/utils')

test.describe('plugin controller interface and events', function () {
  this.timeout(20000)
  let serviceConnection
  let userId
  let consoleServiceId
  let consoleAbilityId
  let consoleNoDataAbilityId
  let servicePluginConfigId

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

  test.describe('controller interface for service plugin configurations', () => {
    test.it('should create service plugin configurations', () => {
      return requestController('servicePluginConfigs', 'create', {
        data: {
          _service: consoleServiceId,
          pluginPackageName: 'foo-domapic-plugin-event-test',
          config: {
            foo: 'foo-config'
          }
        }
      }).then(response => {
        console.log(consoleServiceId)
        console.log(response.body)
        servicePluginConfigId = response.body._id
        return test.expect(response.statusCode).to.equal(200)
      })
    })

    test.it('should have received an event from controller about created service plugin configuration', () => {
      return utils.serviceLogs(500)
        .then(logs => {
          return test.expect(logs).to.contain(`Received servicePluginConfig:created event. Data: {"_id":"${servicePluginConfigId}","_service":"${consoleServiceId}","pluginPackageName":"foo-domapic-plugin-event-test"`)
        })
    })

    test.it('should update service plugin configuration', () => {
      return requestController('servicePluginConfigs', 'update', {
        id: servicePluginConfigId,
        data: {
          config: {
            foo: 'foo-config-2'
          }
        }
      }).then(response => {
        return test.expect(response.statusCode).to.equal(200)
      })
    })

    test.it('should have received an event from controller about updated service plugin configuration', () => {
      return utils.serviceLogs(500)
        .then(logs => {
          return Promise.all([
            test.expect(logs).to.contain(`Received servicePluginConfig:updated event`),
            test.expect(logs).to.contain(`"config":{"foo":"foo-config-2"}`)
          ])
        })
    })

    test.it('should retrieve service plugin configurations', () => {
      return requestController('servicePluginConfigs', 'get').then(response => {
        const pluginConfig = response.body.find(configuration => configuration.pluginPackageName === 'foo-domapic-plugin-event-test')
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(2),
          test.expect(pluginConfig._service).to.equal(consoleServiceId),
          test.expect(pluginConfig._id).to.equal(servicePluginConfigId)
        ])
      })
    })

    test.it('should retrieve service plugin configurations filtering by plugin package name', () => {
      return requestController('servicePluginConfigs', 'create', {
        data: {
          _service: consoleServiceId,
          pluginPackageName: 'foo-domapic-plugin-event-test-2',
          config: {
            foo: 'foo-config-3'
          }
        }
      }).then(response => {
        return requestController('servicePluginConfigs', 'get', {
          filter: {
            'plugin-package-name': 'foo-domapic-plugin-event-test'
          }
        }).then(response => {
          const pluginConfig = response.body.find(configuration => configuration.pluginPackageName === 'foo-domapic-plugin-event-test')
          return Promise.all([
            test.expect(response.statusCode).to.equal(200),
            test.expect(response.body.length).to.equal(1),
            test.expect(pluginConfig._service).to.equal(consoleServiceId),
            test.expect(pluginConfig._id).to.equal(servicePluginConfigId)
          ])
        })
      })
    })

    test.it('should retrieve service plugin configurations filtering by service id', () => {
      return requestController('servicePluginConfigs', 'get', {
        filter: {
          service: consoleServiceId
        }
      }).then(response => {
        const pluginConfig = response.body.find(configuration => configuration.pluginPackageName === 'foo-domapic-plugin-event-test')
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(3),
          test.expect(pluginConfig._service).to.equal(consoleServiceId),
          test.expect(pluginConfig._id).to.equal(servicePluginConfigId)
        ])
      })
    })

    test.it('should retrieve service plugin configuration', () => {
      return requestController('servicePluginConfigs', 'get', {
        id: servicePluginConfigId
      }).then(response => {
        const pluginConfig = response.body
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(pluginConfig._service).to.equal(consoleServiceId),
          test.expect(pluginConfig._id).to.equal(servicePluginConfigId)
        ])
      })
    })
  })

  test.describe('controller interface for getting abilities', () => {
    test.it('should return all abilities', () => {
      return requestController('abilities', 'get').then(response => {
        const console = response.body.find(ability => ability._service === consoleServiceId && ability.name === 'console')
        const consoleNoData = response.body.find(ability => ability._service === consoleServiceId && ability.name === 'consoleNoData')
        consoleAbilityId = console._id
        consoleNoDataAbilityId = consoleNoData._id
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(3),
          test.expect(console).to.not.be.undefined(),
          test.expect(consoleNoDataAbilityId).to.not.be.undefined()
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

  test.describe('when using controller interface for dispatching ability action with no data', () => {
    test.it('should return ability action response', () => {
      return requestController('abilities', 'action', {
        id: consoleNoDataAbilityId
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
            test.expect(logs).to.contain(`Received ability:action event. Data: {"_id":"${consoleNoDataAbilityId}"}`)
          ])
        })
    })

    test.it('should have received an event from controller about triggered event', () => {
      return utils.serviceLogs()
        .then(logs => {
          return Promise.all([
            test.expect(logs).to.contain(`Received ability:event event. Data: {"_id":"${consoleNoDataAbilityId}"}`)
          ])
        })
    })
  })

  test.describe('controller interface for getting logs', () => {
    test.it('should return logs', () => {
      return requestController('logs', 'get').then(response => {
        const action = response.body.find(log => log.type === 'action' && log._ability === consoleAbilityId)
        const event = response.body.find(log => log.type === 'event' && log._ability === consoleAbilityId)
        const actionNoData = response.body.find(log => log.type === 'action' && log._ability === consoleNoDataAbilityId)
        const eventNoData = response.body.find(log => log.type === 'event' && log._ability === consoleNoDataAbilityId)
        return Promise.all([
          test.expect(response.statusCode).to.equal(200),
          test.expect(response.body.length).to.equal(4),
          test.expect(action.data).to.equal('a'),
          test.expect(event.data).to.equal('a'),
          test.expect(actionNoData.data).to.be.undefined(),
          test.expect(eventNoData.data).to.be.undefined()
        ])
      })
    })
  })
})
