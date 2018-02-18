'use strict'

const Abilities = function (service, api) {
  const add = function (ability) {
    return service.tracer.info('Adding ability')
  }

  return {
    add: add
  }
}

module.exports = Abilities
