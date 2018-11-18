'use strict'

const _ = require('lodash')
const path = require('path')
const domapic = require('../../../../index')

const openapi = require('./openapi.json')

domapic.createPlugin({
  packagePath: path.resolve(__dirname)
}).then(async plugin => {
  plugin.events.on(`*`, data => {
    plugin.tracer.info(`Received ${data.entity}:${data.operation} event. Data: ${JSON.stringify(data.data)}`)
  })

  plugin.api.extendOpenApi(openapi)

  plugin.api.addOperations({
    controller: {
      handler: (params, body, res) => {
        let promise
        if (body.filter) {
          promise = plugin.controller[body.entity][body.operation](body.filter)
        } else if (body.id) {
          promise = plugin.controller[body.entity][body.operation](body.id, body.data)
        } else {
          promise = plugin.controller[body.entity][body.operation](body.data)
        }

        return promise.then(result => {
          if (_.isString(result)) {
            return Promise.resolve({
              _id: result
            })
          }
          return Promise.resolve(result || {})
        })
      }
    }
  })

  return plugin.start()
})
