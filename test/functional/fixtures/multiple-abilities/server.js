'use strict'

const path = require('path')

const domapic = require('../../../../index')

new domapic.Service({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  let lastCharacter

  const consoleLog = function (data, ability) {
    lastCharacter = data
    service.tracer.info('Console Called:', data)
      .then(() => {
        service.emit(ability, data)
      })
  }

  return service.register({
    booleanConsole: {
      description: 'Handle boolean console logs',
      data: {
        type: 'boolean'
      },
      event: {
        description: 'Console has just printed a boolean'
      },
      state: {
        description: 'Last boolean printed in console',
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received boolean into console',
        handler: (data) => {
          consoleLog(data, 'booleanConsole')
          return Promise.resolve(data)
        }
      }
    },
    emailConsole: {
      description: 'Handle email console logs',
      data: {
        type: 'string',
        format: 'email',
        maxLength: 15,
        minLength: 11,
        pattern: '^foo'
      },
      event: {
        description: 'Console has just printed an email'
      },
      state: {
        description: 'Last email printed in console',
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received email into console',
        handler: (data) => {
          consoleLog(data, 'emailConsole')
          return Promise.resolve(data)
        }
      }
    },
    enumConsole: {
      description: 'Handle string enum console logs',
      data: {
        type: 'string',
        enum: ['foo1', 'foo2']
      },
      event: {
        description: 'Console has just printed an string from enum'
      },
      state: {
        description: 'Last string from enum printed in console',
        handler: () => {
          return Promise.resolve(lastCharacter)
        }
      },
      action: {
        description: 'Print the received string from enum into console',
        handler: (data) => {
          consoleLog(data, 'enumConsole')
          return Promise.resolve(data)
        }
      }
    }
  }).then(service.start)
})
