const test = require('narval')

const utils = require('./utils')

test.describe('service storage', function () {
  test.it('should have saved test value to storage', () => {
    return utils.readStorage()
      .then(storedData => {
        console.log(storedData)
        return test.expect(storedData.storageTest).to.equal('foo-storage-value')
      })
  })
})
