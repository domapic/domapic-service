'use strict'

const Api = function (service) {
  const addBase = function () {
    return service.tracer.info('Adding base api')
  }

  return {
    addBase: addBase
  }
}

module.exports = Api
