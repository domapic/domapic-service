'use strict'

const _ = require('lodash')
const Promise = require('bluebird')

const templates = require('./templates')

const Abilities = function (service, connection) {
  // TODO, add command, state, event
  // TODO, listen events. Emit connected state
  const registered = {}

  const nameToSchema = function (name) {
    return _.capitalize(_.kebabCase(name))
  }

  const nameToSchemaPath = function (name) {
    return '#/components/schemas/' + nameToSchema(name)
  }

  const nameToJsonSchemaContent = function (name) {
    return {
      'application/json': {
        schema: {
          '$ref': nameToSchemaPath(name)
        }
      }
    }
  }

  const nameToUrl = function (name) {
    return _.kebabCase(name)
  }

  // TODO, validate with a jsonschema each ability
  const validate = function (ability, name) {
    if (registered[name]) {
      return Promise.reject(new service.errors.Conflict(templates.compiled.abilityNameAlreadyExists({
        name: name
      })))
    }
    if (!ability.event && !ability.command && !ability.state) {
      return Promise.reject(new service.errors.BadData(templates.compiled.abilityHasNothingToRegister({
        name: name
      })))
    }
    // TODO, validate data definition
    registered[name] = {}
    return Promise.resolve()
  }

  const registerSchema = function (ability, name) {
    const schema = {}
    if (!ability.data) {
      return Promise.reject(new service.errors.BadData(templates.compiled.abilityHasNoData({
        name: name
      })))
    }
    schema[nameToSchema(name)] = {
      type: 'object',
      properties: {
        data: ability.data
      },
      required: ['data'],
      additionalProperties: false
    }

    return service.server.extendOpenApi({
      tags: [{
        name: name,
        description: templates.compiled.abilityTagDescription({
          name: name
        })
      }],
      components: {
        schemas: schema
      }
    })
  }

  const registerEvent = function (ability, name) {
    if (!ability.event) {
      return Promise.resolve()
    }
    return Promise.resolve()
    // TODO, register event (It does not need open Api)
  }

  const stateResponses = function (name) {
    return {
      '200': {
        description: templates.compiled.stateResponseDescription({
          name: name
        }),
        content: nameToJsonSchemaContent(name)
      }
    }
  }

  const registerState = function (ability, name) {
    const paths = {}
    const stateUrl = '/states/' + nameToUrl(name)

    if (!ability.state) {
      return Promise.resolve()
    }

    paths[stateUrl] = {
      get: {
        tags: ['state', name],
        summary: ability.state.description,
        description: ability.state.description,
        responses: stateResponses(name)
      }
    }

    return service.server.extendOpenApi({
      paths: paths
    })
  }

  const registerCommand = function (ability, name) {
    const paths = {}
    const commandUrl = '/commands/' + nameToUrl(name)

    if (!ability.command) {
      return Promise.resolve()
    }
    // TODO, to prefixes and urls to microservice utils
    paths[commandUrl] = {
      post: {
        tags: ['command', name],
        summary: ability.command.description,
        description: ability.command.description,
        requestBody: {
          description: templates.compiled.commandRequestBodyDescription({
            name: name
          }),
          required: true,
          content: nameToJsonSchemaContent(name)
        }
      }
    }

    if (ability.state) {
      paths[commandUrl].post.responses = stateResponses(name)
    }

    return service.server.extendOpenApi({
      paths: paths
    })
  }

  const addAbilityTags = function () {
    return service.server.extendOpenApi({
      tags: [{
        name: 'command',
        description: templates.compiled.commandTagDescription()
      }, {
        name: 'state',
        description: templates.compiled.stateTagDescription()
      }]
    })
  }

  const register = function (ability, name) {
    return validate(ability, name)
      .then(() => {
        return Promise.all([
          addAbilityTags(),
          registerSchema(ability, name),
          registerEvent(ability, name),
          registerCommand(ability, name),
          registerState(ability, name)
        ])
      })
  }

  const registerAbilities = function (abilities) {
    return Promise.all(_.map(abilities, register))
  }

  return {
    register: registerAbilities
  }
}

module.exports = Abilities
