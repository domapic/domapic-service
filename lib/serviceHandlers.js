'use strict'

const Promise = require('bluebird')

const Abilities = require('./Abilities')
const Connection = require('./Connection')
const Security = require('./Security')
const events = require('./events')
const templates = require('./templates')
const { SERVICE_TYPES } = require('./utils')

class ServiceHandler {
  constructor (service) {
    this.service = service
    this.security = new Security(this.service)
    this.connection = new Connection(this.service, this.security)
    this.started = false

    this.addConnectionApi = this.connection.addApi
    this.addSecurityApi = this.security.addApi
    this.addSecurity = this.security.addApiKeyAuth

    this.start = this.start.bind(this)
    this.connect = this.connect.bind(this)
  }

  getControllerStorageData () {
    return this.service.storage.get()
      .then(storage => {
        if (storage.controllerData) {
          return Promise.resolve({
            controller: storage.controllerData.url,
            userId: storage.controllerData.userId,
            controllerApiKey: storage.controllerData.apiKey
          })
        }
        return Promise.reject(this.service.errors.NotFound(templates.compiled.noControllerFoundInStorage))
      })
  }

  getControllerConfigData () {
    return this.service.config.get()
      .then(config => {
        return Promise.resolve({
          controller: config.controller,
          controllerApiKey: config.controllerApiKey
        })
      })
  }

  connect () {
    return this.getControllerStorageData()
      .then(storageControllerData => this.connection.connect(storageControllerData)
        .catch(() => this.getControllerConfigData()
          .then(controllerData => this.connection.connect({
            ...controllerData,
            userId: storageControllerData.userId
          }))
        )
      )
      .catch(() => this.getControllerConfigData()
        .then(controllerData => this.connection.connect(controllerData))
      )
      .catch(() => Promise.resolve())
  }

  start () {
    this.started = true
    return this.service.server.start()
      .then(this.connect)
  }

  get baseMethods () {
    return {
      tracer: this.service.tracer,
      config: this.service.config,
      start: this.start,
      events
    }
  }
}

class Module extends ServiceHandler {
  constructor (service) {
    super(service)
    this.connection.setType(SERVICE_TYPES.MODULE)
    this.abilities = new Abilities(this.service, this.connection)
    this.register = this.register.bind(this)
  }

  register (abilitiesDefinitions) {
    if (this.started === false) {
      return this.abilities.register(abilitiesDefinitions)
    }
    return Promise.reject(this.service.errors.BadImplementation(templates.compiled.registerAbilitiesServerStarted()))
  }

  get publicMethods () {
    return {
      ...this.baseMethods,
      register: this.register
    }
  }
}

class Plugin extends ServiceHandler {
  constructor (service) {
    super(service)
    this.connection.setType(SERVICE_TYPES.PLUGIN)
  }

  get publicMethods () {
    return {
      ...this.baseMethods
    }
  }
}

module.exports = {
  Module,
  Plugin
}
