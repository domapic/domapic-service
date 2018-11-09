'use strict'

const _ = require('lodash')

const templates = require('./templates')

const customConfig = {
  controller: {
    type: 'string',
    describe: 'Url to connect with Controller'
  },
  controllerApiKey: {
    type: 'string',
    alias: ['controller-api-key', 'api-key'],
    describe: 'Controller api key for registering services'
  }
}

const extendWith = function (options = {}) {
  _.each(options.customConfig, (config, key) => {
    if (customConfig[key]) {
      throw new Error(templates.core.compiled.cli.overwriteOptionError({
        optionName: key
      }))
    }
  })

  options.customConfig = {...options.customConfig, ...customConfig}

  return {
    ...options,
    type: 'module'
  }
}

module.exports = {
  extendWith: extendWith
}
