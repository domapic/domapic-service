const path = require('path')
const domapic = require('../../../../index')

domapic.cli({
  packagePath: path.resolve(__dirname),
  script: path.resolve(__dirname, 'server.js')
})
