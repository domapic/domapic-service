'use strict'

const path = require('path')

const domapic = require('../../../../index')

domapic.createModule({
  packagePath: path.resolve(__dirname)
}).then((service) => {
  const consoleLog = function (data, ability) {
    service.tracer.info('Console Called:', data)
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
          return Promise.resolve(null)
        }
      },
      action: {
        description: 'Print the received boolean into console',
        handler: (data) => {
          consoleLog(data, 'booleanConsole')
          return Promise.resolve(3)
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
          return Promise.resolve('foo')
        }
      },
      action: {
        description: 'Print the received email into console',
        handler: (data) => {
          consoleLog(data, 'emailConsole')
          return Promise.resolve(true)
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
          return Promise.resolve(false)
        }
      },
      action: {
        description: 'Print the received string from enum into console',
        handler: (data) => {
          consoleLog(data, 'enumConsole')
          return Promise.resolve('foo3')
        }
      }
    },
    numericConsole: {
      description: 'Handle numeric console logs',
      data: {
        type: 'number',
        multipleOf: 10,
        minimum: 60,
        maximum: 120
      },
      event: {
        description: 'Console has just printed a number'
      },
      state: {
        description: 'Last number printed in console',
        handler: () => {
          return Promise.resolve('foo')
        }
      },
      action: {
        description: 'Print the received number into console',
        handler: (data) => {
          consoleLog(data, 'numericConsole')
          return Promise.resolve(150)
        }
      }
    },
    numericEnumConsole: {
      description: 'Handle numeric enum console logs',
      data: {
        type: 'number',
        enum: [10, 20, 30, 40],
        minimum: 10,
        maximum: 40,
        exclusiveMaximum: true,
        exclusiveMinimum: true
      },
      event: {
        description: 'Console has just printed a number from enum'
      },
      state: {
        description: 'Last number printed in console',
        handler: () => {
          return Promise.resolve(4)
        }
      },
      action: {
        description: 'Print the received number from enum into console',
        handler: (data) => {
          consoleLog(data, 'numericEnumConsole')
          return Promise.resolve(false)
        }
      }
    },
    noDataConsole: {
      description: 'Prints hello into console',
      event: {
        description: 'Console has just printed hello'
      },
      action: {
        description: 'Print hello into console',
        handler: () => {
          consoleLog('hello', 'noDataConsole')
          return Promise.resolve(5)
        }
      }
    }
  }).then(service.start)
})
