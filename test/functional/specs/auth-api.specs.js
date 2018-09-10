
const PromiseB = require('bluebird')
const _ = require('lodash')
const test = require('narval')

const utils = require('./utils')

const findApiKey = function (property, value) {
  return utils.readStorage()
    .then((data) => {
      return Promise.resolve(_.find(data.apiKeys, (apiKeyData) => {
        return apiKeyData[property] === value
      }))
    })
}

test.describe('auth api', () => {
  test.describe.only('post method', () => {
    test.it('should add a new api key with the provided data', () => {
      return utils.request('/auth/apikey', {
        method: 'POST',
        body: {
          user: 'foo-user',
          role: 'foo-role',
          reference: 'foo-api-key'
        }
      }).then((response) => {
        return findApiKey('reference', 'foo-api-key')
          .then(apiKey => {
            return PromiseB.all([
              test.expect(apiKey).to.not.be.undefined(),
              test.expect(response.statusCode).to.equal(200),
              test.expect(response.body.apiKey).to.equal(apiKey.key)
            ])
          })
      })
    })

    test.it('should add another key for the same user if the provided user already exists', () => {
      return utils.request('/auth/apikey', {
        method: 'POST',
        body: {
          user: 'foo-user',
          role: 'foo-role',
          reference: 'foo-api-key-2'
        }
      }).then((response) => {
        return PromiseB.props({
          previous: findApiKey('reference', 'foo-api-key'),
          new: findApiKey('reference', 'foo-api-key-2')
        })
          .then(apiKeys => {
            return PromiseB.all([
              test.expect(apiKeys.previous).to.not.be.undefined(),
              test.expect(apiKeys.new).to.not.be.undefined(),
              test.expect(apiKeys.previous.user).to.equal('foo-user'),
              test.expect(apiKeys.new.user).to.equal('foo-user'),
              test.expect(response.statusCode).to.equal(200),
              test.expect(response.body.apiKey).to.equal(apiKeys.new.key)
            ])
          })
      })
    })

    test.it('should return an error if the provided reference already exists', () => {
      return utils.request('/auth/apikey', {
        method: 'POST',
        body: {
          user: 'foo-user-2',
          role: 'foo-role',
          reference: 'foo-api-key'
        }
      }).then((response) => {
        return findApiKey('reference', 'foo-api-key')
          .then(apiKey => {
            return PromiseB.all([
              test.expect(apiKey).to.not.be.undefined(),
              test.expect(apiKey.user).to.equal('foo-user'),
              test.expect(response.statusCode).to.equal(422)
            ])
          })
      })
    })
  })

  test.describe('delete method', () => {
    test.it('should delete the provided api key', () => {
      return findApiKey('reference', 'foo-api-key-2')
        .then((apiKey) => {
          return utils.request('/auth/apikey', {
            method: 'DELETE',
            body: {
              apiKey: apiKey.key
            }
          }).then((response) => {
            return PromiseB.props({
              previous: findApiKey('reference', 'foo-api-key'),
              removed: findApiKey('reference', 'foo-api-key-2')
            }).then(apiKeys => {
              return PromiseB.all([
                test.expect(apiKeys.previous).to.not.be.undefined(),
                test.expect(apiKeys.removed).to.be.undefined()
              ])
            })
          })
        })
    })

    test.it('should return an error if the provided key does not exist', () => {
      return utils.request('/auth/apikey', {
        method: 'DELETE',
        body: {
          apiKey: 'fakeApiKey'
        }
      }).then((response) => {
        return test.expect(response.statusCode).to.equal(422)
      })
    })
  })
})
