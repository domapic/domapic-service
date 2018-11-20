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

  plugin.events.on('connection', async () => {
    const abilities = await plugin.controller.abilities.get()
    abilities.map(async ability => {
      if (ability.state) {
        const state = await plugin.controller.abilities.state(ability._id)
        console.log(`Ability "${ability.name}" of module "${ability._module}" has state "${state.data}"`)
      }
    })
  })

  return plugin.start()
})
