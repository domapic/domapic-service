'use strict'

const path = require('path')

const domapic = require('../../../../index')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  let lastCharacter

  const consoleLog = function (data) {
    lastCharacter = data
    console.log(data)
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
          consoleLog(data)
          return Promise.resolve(data)
        }
      }
    }
  }).then(service.start)
})
