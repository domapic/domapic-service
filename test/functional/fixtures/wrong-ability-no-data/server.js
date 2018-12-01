'use strict'

const path = require('path')

const domapic = require('../../../../index')

domapic.createModule({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  return service.register({
    noDataConsole: {
      description: 'Prints hello into console',
      event: {
        description: 'Console has just printed hello'
      },
      state: {
        description: 'Console state',
        handler: () => {
          return Promise.resolve(true)
        }
      },
      action: {
        description: 'Print hello into console',
        handler: () => {
          return Promise.resolve()
        }
      }
    }
  }).catch(service.start)
})
