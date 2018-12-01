'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const jsonschema = require('jsonschema')
const isPromise = require('is-promise')

const templates = require('./templates')
const uris = require('./uris')
const events = require('./events')
const abilitySchema = require('./abilitySchema.json')

jsonschema.Validator.prototype.customFormats.isFunction = function (input) {
  return typeof input === 'function'
}

const Abilities = function (service, connection) {
  const jsonSchemaValidator = new jsonschema.Validator()
  const registered = {}

  const nameToSchema = function (name) {
    return _.capitalize(service.utils.services.normalizeName(name))
  }

  const actionOperationId = function (name) {
    return 'action' + nameToSchema(name)
  }

  const stateOperationId = function (name) {
    return 'state' + nameToSchema(name)
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

  const validate = function (ability, name) {
    let validationError
    if (registered[name]) {
      return Promise.reject(new service.errors.Conflict(templates.compiled.abilityNameAlreadyExists({
        name: name
      })))
    }
    if (!ability.event && !ability.action && !ability.state) {
      return Promise.reject(new service.errors.BadData(templates.compiled.abilityHasNothingToRegister()))
    }
    validationError = jsonSchemaValidator.validate(ability, abilitySchema).errors.join('. ')
    if (validationError.length) {
      return Promise.reject(new service.errors.BadData(validationError))
    }
    registered[name] = ability
    return Promise.resolve()
  }

  const toEmptyDataSchema = function () {
    return {
      type: 'object',
      properties: {
      },
      additionalProperties: false
    }
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

  const DataValidator = function (name, type, ability) {
    const dataSchema = ability.data ? toDataSchema(ability.data) : toEmptyDataSchema()
    return function (data, isResponse) {
      const validationType = isResponse ? 'response' : 'request'
      let validationError
      if (ability.data && (_.isUndefined(data) || _.isUndefined(data.data))) {
        validationError = templates.compiled.dataIsMandatory()
      } else if (!ability.data && !_.isUndefined(data) && !_.isUndefined(data.data)) {
        validationError = templates.compiled.dataIsNotAllowed()
      } else {
        validationError = jsonSchemaValidator.validate(data, dataSchema).errors.join('. ')
        if (!validationError.length) {
          return Promise.resolve(data)
        }
      }

      return service.tracer.error(templates.compiled.invalidAbilityData({
        message: validationError,
        name: name,
        validationType,
        type: type
      })).then(() => {
        return Promise.reject(new service.errors.BadData(`${validationType} ${validationError}`))
      })
    }
  }

  const registerSchema = function (ability, name) {
    const schema = {}
    if (!ability.data && ability.state) {
      return Promise.reject(new service.errors.BadData(templates.compiled.abilityHasNoData({
        name: name
      })))
    }
    schema[nameToSchema(name)] = ability.data ? toDataSchema(ability.data) : toEmptyDataSchema()

    return service.server.extendOpenApi({
      tags: [{
        name: name,
        description: ability.description
      }],
      components: {
        schemas: schema
      }
    })
  }

  const EventHandler = function (name, ability) {
    const validateData = new DataValidator(name, 'event', ability)
    return function (result) {
      const data = !_.isUndefined(result) ? { data: result } : result
      return validateData(data, true)
        .then(() => {
          return connection.sendAbilityEvent(name, data)
        })
        .catch((error) => {
          return service.tracer.error(templates.compiled.sendEventError({
            name: name,
            message: error.message
          }))
        })
    }
  }

  const AbilityHandler = function (name, type, ability) {
    const validateData = new DataValidator(name, type, ability)
    const abilityHandler = (params, requestBody, response, user) => {
      const bodyValidation = type === 'action' ? validateData(requestBody) : Promise.resolve()
      return bodyValidation.then(() => {
        const result = ability[type].handler(requestBody && requestBody.data)
        const resultPromise = isPromise(result) ? result : Promise.resolve(result)
        return resultPromise.then(result => {
          const data = !_.isUndefined(result) ? { data: result } : result
          return validateData(data, true)
            .then(() => Promise.resolve(data))
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
    events.on(name, new EventHandler(name, ability))
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
    const stateUrl = `/${uris.abilityStateHandler(name)}`
    const operationId = stateOperationId(name)
    const operations = {}

    if (!ability.state) {
      return Promise.resolve()
    }

    operations[operationId] = new AbilityHandler(name, 'state', ability)

    const get = {
      tags: ['state', name],
      summary: ability.state.description,
      description: ability.state.description,
      operationId: operationId,
      responses: stateResponses(name)
    }

    if (ability.state.auth !== false) {
      get.security = [{apiKey: []}]
    }

    paths[stateUrl] = {
      get
    }

    return Promise.all([
      service.server.extendOpenApi({
        paths: paths
      }),
      service.server.addOperations(operations)
    ])
  }

  const registerAction = function (ability, name) {
    const paths = {}
    const actionUrl = `/${uris.abilityActionHandler(name)}`
    const operationId = actionOperationId(name)
    const operations = {}

    if (!ability.action) {
      return Promise.resolve()
    }

    operations[operationId] = new AbilityHandler(name, 'action', ability)

    const post = {
      tags: ['action', name],
      summary: ability.action.description,
      description: ability.action.description,
      operationId: operationId,
      requestBody: {
        description: templates.compiled.actionRequestBodyDescription({
          name: name
        }),
        required: !!ability.data,
        content: nameToJsonSchemaContent(name)
      }
    }

    if (ability.action.auth !== false) {
      post.security = [{apiKey: []}]
    }

    paths[actionUrl] = {
      post
    }

    if (ability.state) {
      paths[actionUrl].post.responses = stateResponses(name)
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
        name: 'action',
        description: templates.compiled.actionTagDescription()
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
          registerAction(ability, name),
          registerState(ability, name),
          connection.addAbility(ability, name)
        ])
      })
      .then(() => {
        return Promise.resolve(service)
      })
      .catch(err => {
        const errorMessage = templates.compiled.errorRegisteringAbility({
          message: err.message
        })
        return service.tracer.error(errorMessage).then(() => {
          return Promise.reject(new service.errors.BadImplementation(errorMessage))
        })
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
