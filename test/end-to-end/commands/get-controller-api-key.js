
const testUtils = require('narval/utils')

const getLogs = () => {
  return testUtils.logs.combined('controller')
    .then(log => {
      const match = log.match(/Use the next api key to register services: (\S*)\n/)
      if (match && match[1]) {
        console.log(match[1])
        return Promise.resolve()
      }
      return waitAndGetLogs()
    })
}

const waitAndGetLogs = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      getLogs().then(() => {
        resolve()
      })
    }, 2000)
  })
}

getLogs()
