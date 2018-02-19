'use strict'

const templates = require('./templates')

const Abilities = function (service, connection) {
  const add = function (ability) {
    return service.tracer.log(templates.compiled.addingAbility())
  }

  return {
    add: add
  }
}

module.exports = Abilities
