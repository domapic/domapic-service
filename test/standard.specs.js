
const test = require('domapic-microservice/test')

test.describe('Standard code style', function () {
  test.it('conforms to standard', test.standard.files(['*.js', '**/*.js'])).timeout(10000)
})
