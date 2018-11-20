'use strict'

const path = require('path')
const domapic = require('../../../../index')

const options = require('./options')

domapic.createPlugin({
  packagePath: path.resolve(__dirname),
  customConfig: options
}).then(async plugin => {
  let exampleOption = await plugin.config.get('exampleOption')
  await plugin.tracer.debug(`example option: ${exampleOption}`)
  return plugin.start()
})
