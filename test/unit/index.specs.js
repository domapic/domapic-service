
const test = require('narval')

const index = require('../../index')

test.describe('index', () => {
  test.it('should export a Service constructor', () => {
    test.expect(typeof index.Service).to.equal('function')
  })
})
