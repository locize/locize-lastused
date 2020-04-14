import expect from 'expect.js'
import lastUsed from '../index.js'
import server from './fixtures/server.js'

describe(`locize lastused using ${typeof XMLHttpRequest === 'function' ? 'XMLHttpRequest' : 'fetch'}`, () => {
  before((done) => {
    lastUsed.init({
      lastUsedPath: 'http://localhost:6001/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
      apiKey: 'bla',
      projectId: 'test',
      version: 'latest',
      debounceSubmit: 200
    })
    server(done)
  })

  describe('#used', () => {
    it('should work', (done) => {
      lastUsed.used('transl', 'my.key', (err) => {
        expect(err).not.to.be.ok()
        done()
      })
    })
  })
})
