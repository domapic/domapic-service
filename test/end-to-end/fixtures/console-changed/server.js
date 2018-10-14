'use strict'

const path = require('path')

const domapic = require('../../../../index')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  let lastCharacter

  const consoleLog = function (data) {
    lastCharacter = data
    console.log(`Printing into console: ${data}`)
  }

  return service.register({
    console: {
      description: 'Handle console log version 2',
      data: {
        type: 'string',
        maxLength: 1
      },
      event: {
        description: 'Console has just printed a character version 2'
      },
      state: {
        description: 'Last character printed in console version 2',
        auth: false, // default true
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received character into console version 2',
        auth: false,
        handler: (data) => {
          consoleLog(data)
          return Promise.resolve(data)
        }
      }
    }
  }).then(service.start)
})
