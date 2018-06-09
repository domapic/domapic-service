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

const ReadLogs = function (fileName = 'combined-outerr') {
  return function (serviceName = 'domapic-service') {
    return readFile(path.resolve(__dirname, '..', '..', '..', '.narval', 'logs', 'integration', process.env.narval_suite, serviceName, `${fileName}.log`))
  }
}

const waitOnestimatedStartTime = function () {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ESTIMATED_START_TIME)
  })
}

const request = function (uri, options = {}) {
  const defaultOptions = {
    uri: `http://${SERVICE_HOST}:${SERVICE_PORT}/api/${uri}`,
    json: true,
    strictSSL: false,
    rejectUnauthorized: false,
    simple: false,
    requestCert: false,
    resolveWithFullResponse: true
  }
  return requestPromise(Object.assign(defaultOptions, options))
}

const readStorage = function () {
  return readFile(path.resolve(__dirname, '..', '..', '..', DOMAPIC_PATH, '.domapic', 'foo-service', 'storage', 'service.json'))
    .then((data) => {
      return Promise.resolve(JSON.parse(data))
    })
}

module.exports = {
  waitOnestimatedStartTime: waitOnestimatedStartTime,
  readOutErr: new ReadLogs(),
  request: request,
  readStorage: readStorage
}
