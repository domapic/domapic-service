'use strict'

const path = require('path')
const fs = require('fs')

const requestPromise = require('request-promise')

const SERVICE_HOST = process.env.service_host_name
const SERVICE_PORT = process.env.service_port
const DOMAPIC_PATH = process.env.domapic_path
const ESTIMATED_START_TIME = 1000

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
    uri: `http://${SERVICE_HOST}:${SERVICE_PORT}/api${uri}`,
    json: true,
    strictSSL: false,
    rejectUnauthorized: false,
    simple: false,
    requestCert: false,
    resolveWithFullResponse: true
  }
  return requestPromise(Object.assign(defaultOptions, options))
}

const readStorage = function (file = 'storage') {
  return readFile(path.resolve(__dirname, '..', '..', '..', DOMAPIC_PATH, '.domapic', process.env.service_name || 'foo-service', file, 'service.json'))
    .then((data) => {
      return Promise.resolve(JSON.parse(data))
    })
}

const controllerApiKey = (property, value) => readStorage()
  .then(data => Promise.resolve(data.apiKeys.find(apiKeyData => apiKeyData.user === 'controller')))

class Connection {
  constructor () {
    this._apiKey = null
  }

  async request (uri, options = {}) {
    const method = options.method || 'GET'
    if (!this._apiKey) {
      this._apiKey = await controllerApiKey()
    }
    return request(uri,
      {
        headers: {
          'X-Api-Key': this._apiKey.key
        },
        method,
        ...options
      }
    )
  }
}

module.exports = {
  waitOnestimatedStartTime,
  request,
  readStorage,
  Connection,
  DOMAPIC_PATH,
  SERVICE_HOST,
  SERVICE_PORT
}
