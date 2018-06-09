'use strict'

const path = require('path')
const fs = require('fs')

const ESTIMATED_START_TIME = 1000

const ReadLogs = function (fileName = 'combined-outerr') {
  return function (serviceName = 'domapic-service') {
    return new Promise((resolve, reject) => {
      fs.readFile(path.resolve(__dirname, '..', '..', '..', '.narval', 'logs', 'integration', process.env.narval_suite, serviceName, `${fileName}.log`), 'utf8', (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

const waitOnestimatedStartTime = function () {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ESTIMATED_START_TIME)
  })
}

module.exports = {
  waitOnestimatedStartTime: waitOnestimatedStartTime,
  readOutErr: new ReadLogs()
}
