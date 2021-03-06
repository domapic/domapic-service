'use strict'

const path = require('path')
const fs = require('fs')

const testUtils = require('narval/utils')
const requestPromise = require('request-promise')

const SERVICE_HOST = process.env.service_host_name
const SERVICE_PORT = process.env.service_port
const DOMAPIC_PATH = process.env.domapic_path
const SERVICE_NAME = process.env.service_name
const ESTIMATED_START_TIME = 1000
const CONTROLLER_URL = `http://${process.env.controller_host_name}:3000`

const readFile = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const waitOnestimatedStartTime = function (time = ESTIMATED_START_TIME) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

const request = function (uri, options = {}) {
  const defaultOptions = {
    uri,
    json: true,
    strictSSL: false,
    rejectUnauthorized: false,
    simple: false,
    requestCert: false,
    resolveWithFullResponse: true
  }
  return requestPromise({ ...defaultOptions, ...options })
}

const readStorage = function (file = 'storage') {
  return readFile(path.resolve(__dirname, '..', '..', '..', DOMAPIC_PATH, '.domapic', SERVICE_NAME || 'foo-service', file, 'service.json'))
    .then((data) => {
      return Promise.resolve(JSON.parse(data))
    })
}

const getControllerApiKey = () => {
  return testUtils.logs.combined('controller')
    .then(log => {
      const match = log.match(/Use the next api key to register services: (\S*)\n/)
      if (match && match[1]) {
        console.log(match[1])
        return Promise.resolve(match[1])
      }
      return waitAndGetControllerApiKey()
    })
}

const waitAndGetControllerApiKey = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      getControllerApiKey().then(controllerApiKey => {
        resolve(controllerApiKey)
      })
    }, 1000)
  })
}

const getServiceApiKey = () => {
  return testUtils.logs.combined('service')
    .then(log => {
      const match = log.match(/Try adding connection from Controller, using the next service Api Key: (\S*)\n/)
      if (match && match[1]) {
        console.log(match[1])
        return Promise.resolve(match[1])
      }
      return waitAndGetServiceApiKey()
    })
}

const waitAndGetServiceApiKey = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      getServiceApiKey().then(serviceApiKey => {
        resolve(serviceApiKey)
      })
    }, 1000)
  })
}

class ControllerConnection {
  constructor () {
    this._accessToken = null
  }

  async adminLogin () {
    return request(`${CONTROLLER_URL}/api/auth/jwt`, {
      method: 'POST',
      body: {
        user: 'admin',
        password: 'admin'
      }
    }).then(response => Promise.resolve(response.body.accessToken))
  }

  async request (uri, options = {}) {
    const method = options.method || 'GET'
    if (!this._accessToken) {
      this._accessToken = await this.adminLogin()
    }
    return request(`${CONTROLLER_URL}/api${uri}`,
      {
        headers: {
          authorization: `Bearer ${this._accessToken}`
        },
        method,
        ...options
      }
    )
  }
}

class ServiceConnection {
  constructor (apiKey) {
    this._apiKey = apiKey
  }

  async getApiKey () {
    return getServiceApiKey()
  }

  async request (uri, options = {}) {
    const method = options.method || 'GET'
    if (!this._apiKey) {
      this._apiKey = await this.getApiKey()
    }
    return request(`http://${SERVICE_HOST}:${SERVICE_PORT}/api${uri}`,
      {
        headers: {
          'X-Api-Key': this._apiKey
        },
        method,
        ...options
      }
    )
  }
}

const serviceLogs = (time = 200) => {
  return waitOnestimatedStartTime(time)
    .then(() => testUtils.logs.combined('service'))
}

module.exports = {
  waitOnestimatedStartTime,
  request,
  readStorage,
  SERVICE_NAME,
  SERVICE_HOST,
  SERVICE_PORT,
  CONTROLLER_URL,
  getControllerApiKey,
  getServiceApiKey,
  ControllerConnection,
  ServiceConnection,
  serviceLogs
}
