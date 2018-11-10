const path = require('path')
const domapic = require('../../../../index')

const options = require('./options')

domapic.cli({
  packagePath: path.resolve(__dirname),
  script: path.resolve(__dirname, 'server.js'),
  customConfig: options
})
