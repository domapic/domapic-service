'use strict'

const Promise = require('bluebird')

const templates = require('./templates')

const Abilities = function (service, connection) {
  // TODO, add command, state, event
  // TODO, listen events. Emit connected state

  const getState = function () {
    return Promise.resolve()
  }

  const setState = function () {
    return Promise.resolve()
  }

  const command = function (data) {
    return service.tracer.log(templates.compiled.addingAbility({
      type: 'command'
    }))
  }

  const state = function (data) {
    return service.tracer.log(templates.compiled.addingAbility({
      type: 'state'
    }))
  }

  const event = function (data) {
    return service.tracer.log(templates.compiled.addingAbility({
      type: 'event'
    }))
  }

  return {
    register: {
      command: command,
      state: state,
      event: event
    },
    // commands: commands,
    // events: events,
    states: {
      get: getState,
      set: setState
    }
  }
}

module.exports = Abilities
