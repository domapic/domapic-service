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
    describe: 'Api key for Controller authentication'
  }
}

const extendWith = function (options) {
  options = options || {}
  _.each(options.customConfig, (config, key) => {
    if (customConfig[key]) {
      throw new Error(templates.core.compiled.cli.overwriteOptionError({
        optionName: key
      }))
    }
  })

  options.customConfig = _.extend(options.customConfig || {}, customConfig)

  return options
}

module.exports = {
  extendWith: extendWith
}
