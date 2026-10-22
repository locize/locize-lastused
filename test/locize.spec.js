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

  describe('a refused api key', () => {
    const origWarn = console.warn
    const warnings = []
    before(() => {
      lastUsed.init({
        lastUsedPath: 'http://localhost:6001/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
        apiKey: 'readonly-key',
        projectId: 'refused',
        version: 'latest',
        debounceSubmit: 200
      })
      console.warn = (...args) => warnings.push(args.join(' '))
    })
    after(() => { console.warn = origWarn })

    it('should warn once and stop sending', (done) => {
      lastUsed.used('transl', 'first.key', () => {
        expect(warnings.length).to.be(1)
        expect(warnings[0]).to.contain('answered 401')
        lastUsed.used('transl', 'second.key', (err) => {
          expect(err.message).to.be('not allowed')
          expect(warnings.length).to.be(1)
          done()
        })
      })
    })
  })
})
