'use strict'

const path = require('path')
const domapic = require('../../../../index')

const options = require('./options')

domapic.createModule({
  packagePath: path.resolve(__dirname),
  customConfig: options
}).then(async module => {
  let status = await module.config.get('initialStatus')

  await module.register({
    switch: {
      description: 'Handle the relay status',
      data: {
        type: 'boolean'
      },
      event: {
        description: 'The relay status has changed'
      },
      state: {
        description: 'Current relay status',
        handler: () => status
      },
      action: {
        description: 'Switch on/off the relay',
        handler: newStatus => {
          status = newStatus
          module.emit('switch', status)
          return status
        }
      }
    }
  })

  return module.start()
})
