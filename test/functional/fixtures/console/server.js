'use strict'

const path = require('path')

const domapic = require('../../../../index')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  let lastCharacter

  const consoleLog = function (data) {
    lastCharacter = data
    service.tracer.info('Console Called:', data)
      .then(() => {
        service.emit('console', data)
      })
  }

  return service.register({
    console: {
      description: 'Handle custom console logs',
      data: {
        // type: 'string'
        // format: 'email'
        // enum: ['dasdad', 'asdad']
        // maxLength: 12,
        // minLength: 5,
        // pattern: '^testing'

        // type: 'number',
        // type: 'float',
        // type: 'integer',
        // enum: [10, 20, 30],
        // multipleOf: 10,
        // minimum: 11,
        // maximum: 25,
        // exclusiveMaximum: true,
        // exclusiveMinimum: true
        // TODO, check allowed schema properties for string

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
  }).then(service.start)
})
