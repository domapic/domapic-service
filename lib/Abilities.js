'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const jsonschema = require('jsonschema')

const templates = require('./templates')
const events = require('./events')

jsonschema.Validator.prototype.customFormats.isFunction = function (input) {
  return typeof input === 'function'
}

const abilitySchema = {
  type: 'object',
  properties: {
    data: {
      type: 'object'
      // TODO, validate if it is a valid json schema definition itself
    },
    event: {
      type: 'object',
      properties: {
        description: {
          type: 'string'
        }
      },
      required: ['description'],
      additionalProperties: false
    },
    state: {
      type: 'object',
      properties: {
        description: {
          type: 'string'
        },
        auth: {
          type: 'boolean'
        },
        handler: {
          format: 'isFunction'
        }
      },
      required: ['description', 'handler'],
      additionalProperties: false
    },
    command: {
      type: 'object',
      properties: {
        description: {
          type: 'string'
        },
        auth: {
          type: 'boolean'
        },
        handler: {
          format: 'isFunction'
        }
      },
      required: ['description', 'handler'],
      additionalProperties: false
    }
  },
  additionalProperties: false,
  required: ['data']
  // TODO, require at least one of 'event', 'state', or 'command'
}

const Abilities = function (service, connection) {
  // TODO, to prefixes and urls to microservice utils

  const jsonSchemaValidator = new jsonschema.Validator()
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

  const getCommandUrl = function (name) {
    return '/commands/' + nameToUrl(name)
  }

  const getStateUrl = function (name) {
    return '/states/' + nameToUrl(name)
  }

  const commandOperationId = function (name) {
    return 'command' + nameToSchema(name)
  }

  const stateOperationId = function (name) {
    return 'state' + nameToSchema(name)
  }

  const validate = function (ability, name) {
    let validationError
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
    validationError = jsonSchemaValidator.validate(ability, abilitySchema).errors.join('. ')
    if (validationError.length) {
      return Promise.reject(new service.errors.BadImplementation(validationError))
    }
    registered[name] = {}
    return Promise.resolve()
  }

  const toDataSchema = function (schema) {
    return {
      type: 'object',
      properties: {
        data: schema
      },
      required: ['data'],
      additionalProperties: false
    }
  }

  const DataValidator = function (schema, name, type) {
    const dataSchema = toDataSchema(schema)
    return function (data) {
      const validationError = jsonSchemaValidator.validate({
        data: data
      }, dataSchema).errors.join('. ')

      if (!validationError.length) {
        return Promise.resolve(data)
      }

      return service.tracer.error(templates.compiled.invalidAbilityData({
        message: validationError,
        name: name,
        type: type
      })).then(() => {
        return Promise.reject(new service.errors.BadImplementation(validationError))
      })
    }
  }

  const registerSchema = function (ability, name) {
    const schema = {}
    if (!ability.data) {
      return Promise.reject(new service.errors.BadData(templates.compiled.abilityHasNoData({
        name: name
      })))
    }
    schema[nameToSchema(name)] = toDataSchema(ability.data)

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

  const EventHandler = function (name, dataSchema) {
    const validateData = new DataValidator(dataSchema, name, 'event')
    const eventNameUrl = nameToUrl(name)
    return function (result) {
      return validateData(result)
        .then(connection.getClient)
        .then((client) => {
          return client.sendEvent(eventNameUrl, {
            data: result
          })
        })
        .catch((error) => {
          return service.tracer.error(templates.compiled.sendEventError({
            name: name,
            message: error.message
          }))
        })
    }
  }

  const AbilityHandler = function (name, type, dataSchema, handler, auth) {
    const validateData = new DataValidator(dataSchema, name, type)
    const abilityHandler = function (params, requestBody, response) {
      return handler(requestBody && requestBody.data).then((result) => {
        return validateData(result)
          .then(() => {
            return Promise.resolve({
              data: result
            })
          })
      })
    }
    return {
      handler: abilityHandler
    }
  }

  const registerEvent = function (ability, name) {
    if (!ability.event) {
      return Promise.resolve()
    }
    events.on(name, new EventHandler(name, ability.data))
    return Promise.resolve()
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
    const stateUrl = getStateUrl(name)
    const operationId = stateOperationId(name)
    const operations = {}

    if (!ability.state) {
      return Promise.resolve()
    }

    operations[operationId] = new AbilityHandler(name, 'state', ability.data, ability.state.handler, ability.state.auth)

    paths[stateUrl] = {
      get: {
        tags: ['state', name],
        summary: ability.state.description,
        description: ability.state.description,
        operationId: operationId,
        responses: stateResponses(name)
      }
    }

    return Promise.all([
      service.server.extendOpenApi({
        paths: paths
      }),
      service.server.addOperations(operations)
    ])
  }

  const registerCommand = function (ability, name) {
    const paths = {}
    const commandUrl = getCommandUrl(name)
    const operationId = commandOperationId(name)
    const operations = {}

    if (!ability.command) {
      return Promise.resolve()
    }

    operations[operationId] = new AbilityHandler(name, 'command', ability.data, ability.command.handler, ability.command.auth)

    paths[commandUrl] = {
      post: {
        tags: ['command', name],
        summary: ability.command.description,
        description: ability.command.description,
        operationId: operationId,
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

    return Promise.all([
      service.server.extendOpenApi({
        paths: paths
      }),
      service.server.addOperations(operations)
    ])
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
      .catch((err) => {
        return service.tracer.error(templates.compiled.abilityValidationError({
          name: name,
          message: err.message
        })).then(() => {
          return Promise.reject(err)
        })
      })
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
