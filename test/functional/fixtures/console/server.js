'use strict'

const path = require('path')

const domapic = require('../../../../index')

domapic.createModule({
  packagePath: path.resolve(__dirname)
}).then(async service => {
  let lastCharacter

  const consoleLog = function (data) {
    lastCharacter = data
    service.tracer.info('Console Called:', data)
      .then(() => {
        service.events.emit('console', data)
      })
  }

  await service.storage.set('storageTest', 'foo-storage-value')

  await service.register({
    console: {
      description: 'Handle custom console logs',
      data: {
        type: 'boolean'
      },
      event: {
        description: 'Console has just printed a character'
      },
      state: {
        description: 'Last character printed in console',
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received character into console',
        handler: (data) => {
          consoleLog(data)
          return Promise.resolve(data)
        }
      }
    }
  })

  return service.start()
})
