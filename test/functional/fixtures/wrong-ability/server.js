'use strict'

const path = require('path')

const domapic = require('../../../../index')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  return service.register({
    console: {
      description: 'Handle custom console logs'
    }
  }).catch(service.start)
})
