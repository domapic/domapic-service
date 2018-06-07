'use strict'

const domapic = require('domapic-base')

const options = require('./lib/options')

const cli = function (cliOptions) {
  domapic.cli(options.extend(cliOptions))
}

module.exports = cli
