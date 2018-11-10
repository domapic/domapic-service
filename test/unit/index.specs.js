
const test = require('narval')

const index = require('../../index')

test.describe('index', () => {
  test.it('should export a createModule method', () => {
    test.expect(typeof index.createModule).to.equal('function')
  })
})
