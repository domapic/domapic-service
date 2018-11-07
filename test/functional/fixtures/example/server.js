'use strict'

const path = require('path')
const domapic = require('../../../../index')

domapic.Service({ packagePath: path.resolve(__dirname)})
  .then(async module => {
    let status = false

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
          handler: () => Promise.resolve(status)
        },
        action: {
          description: 'Switch on/off the relay',
          handler: newStatus => {
            status = newStatus
            module.emit('switch', status)
            return Promise.resolve(status)
          }
        }
      }
    })

    return module.start()
  })
