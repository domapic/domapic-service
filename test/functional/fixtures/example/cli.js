const path = require('path')
const domapic = require('../../../../index')

domapic.cli({
  script: path.resolve(__dirname, 'server.js')
})
