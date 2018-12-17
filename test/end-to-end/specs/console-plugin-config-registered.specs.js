
const test = require('narval')

const utils = require('./utils')

test.describe('when connection with controller is successful', function () {
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('console plugin config for foo-domapic-plugin should be registered in controller', () => {
    return controllerConnection.request('/service-plugin-configs')
      .then(response => {
        const pluginConfig = response.body.find(config => config.pluginPackageName === 'foo-domapic-plugin')
        return test.expect(pluginConfig).to.not.be.undefined()
      })
  })
})
