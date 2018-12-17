
const test = require('narval')

const utils = require('./utils')

test.describe('when connection with controller is successful', function () {
  this.timeout(10000)

  const controllerConnection = new utils.ControllerConnection()

  test.it('console plugin configs for foo-domapic-plugin and foo-domapic-plugin-2 should be registered in controller', () => {
    return controllerConnection.request('/service-plugin-configs')
      .then(response => {
        const pluginConfig = response.body.find(config => config.pluginPackageName === 'foo-domapic-plugin')
        const pluginConfig2 = response.body.find(config => config.pluginPackageName === 'foo-domapic-plugin-2')
        return Promise.all([
          test.expect(pluginConfig).to.not.be.undefined(),
          test.expect(pluginConfig2).to.not.be.undefined()
        ])
      })
  })
})
