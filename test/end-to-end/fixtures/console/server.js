'use strict'

const path = require('path')

const pluginConfigs = require('./pluginConfigs.json')
const domapic = require('../../../../index')

domapic.createModule({
  packagePath: path.resolve(__dirname)
}).then(async service => {
  let lastCharacter = ''

  const consoleLog = function (data, eventName) {
    lastCharacter = data
    console.log(`Printing into console: ${data}`)
    service.events.emit(eventName, data)
  }

  await service.register({
    console: {
      description: 'Handle console log',
      data: {
        type: 'string',
        maxLength: 1
      },
      event: {
        description: 'Console has just printed a character'
      },
      state: {
        description: 'Last character printed in console',
        auth: false,
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received character into console',
        handler: (data) => {
          consoleLog(data, 'console')
          return Promise.resolve(data)
        }
      }
    },
    consoleNoData: {
      description: 'Handle console log with no data',
      event: {
        description: 'Console with no data received'
      },
      action: {
        description: 'Print the received character into console',
        handler: () => {
          console.log('Received action with no data')
          service.events.emit('consoleNoData')
          return Promise.resolve()
        }
      }
    },
    consoleNumeric: {
      description: 'Handle console log with numeric data',
      data: {
        type: 'number',
        minimum: 1,
        maximum: 10
        // TODO, add an enum
      },
      event: {
        description: 'Console with numeric data received'
      },
      action: {
        description: 'Print the received number into console',
        handler: (data) => {
          consoleLog(data, 'consoleNumeric')
          return Promise.resolve(data)
        }
      }
    }
  })

  await service.addPluginConfig(pluginConfigs)

  return service.start()
})
