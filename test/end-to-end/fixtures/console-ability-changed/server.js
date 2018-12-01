'use strict'

const path = require('path')

const domapic = require('../../../../index')

domapic.createModule({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  let lastCharacter = ''

  const consoleLog = function (data, eventName) {
    lastCharacter = data
    console.log(`Printing into console: ${data}`)
    service.events.emit(eventName, data)
  }

  return service.register({
    stdout: {
      description: 'Handle stdout',
      data: {
        type: 'number',
        maximum: 5,
        minimum: 2
      },
      state: {
        description: 'Last character printed in stdout',
        auth: false, // default true
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received character into stdout',
        auth: false,
        handler: (data) => {
          consoleLog(data, 'stdout')
          return Promise.resolve(data)
        }
      }
    },
    consoleNoData: {
      description: 'Handle console log with no data before, now has data',
      data: {
        type: 'number',
        maximum: 10,
        minimum: 1
      },
      event: {
        description: 'Console with data received'
      },
      action: {
        description: 'Print the received character into console',
        handler: (data) => {
          consoleLog(data, 'consoleNoData')
          return Promise.resolve(data)
        }
      }
    },
    consoleNumeric: {
      description: 'Handle console log with numeric data before, now has no data',
      event: {
        description: 'Console with numeric data received'
      },
      action: {
        description: 'Print the received number into console',
        handler: () => {
          console.log('Printing consoleNumeric with no data')
          service.events.emit('consoleNumeric')
          return Promise.resolve()
        }
      }
    }
  }).then(service.start)
})
