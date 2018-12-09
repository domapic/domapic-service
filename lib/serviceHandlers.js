'use strict'

const Promise = require('bluebird')

const Abilities = require('./Abilities')
const Connection = require('./Connection')
const ControllerEvents = require('./ControllerEvents')
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
      .then(storageControllerData => {
        return Promise.all([
          this.service.tracer.info(templates.compiled.connectingUsingStorage()),
          this.connection.connect(storageControllerData)
        ]).catch(() => this.getControllerConfigData()
          .then(controllerData => {
            return Promise.all([
              this.service.tracer.info(templates.compiled.connectingUsingUserAndConfig()),
              this.connection.connect({
                ...controllerData,
                userId: storageControllerData.userId
              })
            ])
          })
        )
      })
      .catch(() => {
        return this.getControllerConfigData()
          .then(controllerData => {
            return Promise.all([
              this.service.tracer.info(templates.compiled.connectingIgnoringStorage()),
              this.connection.connect(controllerData)
            ])
          })
      })
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
      storage: this.service.storage,
      errors: this.service.errors,
      api: {
        extendOpenApi: this.service.server.extendOpenApi,
        addOperations: this.service.server.addOperations
      },
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
    this.init = this.init.bind(this)
  }

  register (abilitiesDefinitions) {
    if (this.started === false) {
      return this.abilities.register(abilitiesDefinitions)
    }
    return Promise.reject(this.service.errors.BadImplementation(templates.compiled.registerAbilitiesServerStarted()))
  }

  init () {
    return Promise.all([
      this.addConnectionApi(),
      this.addSecurityApi(),
      this.addSecurity()
    ])
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
    this.controllerEvents = new ControllerEvents(this.service, this.connection)
    this.init = this.init.bind(this)

    this.controller = this.connection.controllerClient
  }

  init () {
    return Promise.all([
      this.addConnectionApi(),
      this.controllerEvents.addApi(),
      this.addSecurityApi(),
      this.addSecurity()
    ])
  }

  get publicMethods () {
    return {
      ...this.baseMethods,
      controller: this.controller
    }
  }
}

module.exports = {
  Module,
  Plugin
}
