'use strict'

const microService = require('domapic-microservice')

const options = require('./lib/options')

const cli = function (cliOptions) {
  microService.cli(options.extend(cliOptions))
}

module.exports = cli
