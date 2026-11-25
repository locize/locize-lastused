import expect from 'expect.js'
import lastUsed from '../index.js'
import server, { received } from './fixtures/server.js'

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

describe(`locize lastused sending (${typeof XMLHttpRequest === 'function' ? 'XMLHttpRequest' : 'fetch'})`, () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const init = (extra) => lastUsed.init({
    lastUsedPath: 'http://localhost:6001/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
    apiKey: 'bla',
    projectId: 'record',
    version: 'latest',
    debounceSubmit: 50,
    ...extra
  })
  beforeEach(() => { received.length = 0 })

  it('keeps sending new keys after a send with nothing new', async () => {
    init()
    lastUsed.used('a', 'first'); await wait(250)
    lastUsed.used('a', 'first'); await wait(250) // known: nothing to send
    lastUsed.used('a', 'second'); await wait(250)
    expect(received).to.eql([['a', ['first']], ['a', ['second']]])
  })

  it('sends while the page keeps translating known keys', async () => {
    init()
    const timer = setInterval(() => lastUsed.used('b', 'busy'), 10)
    await wait(300)
    clearInterval(timer)
    expect(received).to.eql([['b', ['busy']]])
  })

  it('sends while new keys keep coming faster than the interval', async () => {
    init()
    let n = 0
    const timer = setInterval(() => lastUsed.used('b2', `k${n++}`), 20)
    await wait(400)
    clearInterval(timer)
    expect(received.length).to.be.above(2)
  })

  it('sends a key again once resubmitAfter has passed', async () => {
    init({ resubmitAfter: 600 })
    lastUsed.used('c', 'again'); await wait(250)
    lastUsed.used('c', 'again'); await wait(250)
    expect(received.length).to.be(1)
    await wait(200)
    lastUsed.used('c', 'again'); await wait(250)
    expect(received).to.eql([['c', ['again']], ['c', ['again']]])
  })

  it('keeps the keys of a failed send for the next one', async () => {
    init()
    lastUsed.used('flaky', 'kept'); await wait(400)
    expect(received).to.eql([['flaky', ['kept']]])
  })

  it('tries a failed key once more, not forever', async () => {
    init()
    lastUsed.used('down', 'k'); await wait(600)
    expect(received).to.eql([['down', ['k']], ['down', ['k']]])
  })

  it('a page closing during a send sends what came after it at once', async () => {
    init()
    lastUsed.used('slow', 'x1'); await wait(100) // its send is in flight now
    lastUsed.used('slow', 'x2')
    lastUsed.send(true) // pagehide
    await wait(100)
    expect(received).to.eql([['slow', ['x1']], ['slow', ['x2']]])
    await wait(400)
  })

  it('calls every callback once', async () => {
    init()
    const calls = []
    lastUsed.used('e', 'a', (err) => calls.push(['a', err]))
    lastUsed.used('e', 'b', (err) => calls.push(['b', err]))
    lastUsed.used('e', 'a', (err) => calls.push(['a again', err])) // already waiting: at once
    await wait(250)
    expect(calls).to.eql([['a again', undefined], ['a', undefined], ['b', undefined]])
  })

  it('reports a connection that never answers as an error, and tries it once more', async () => {
    // XMLHttpRequest answers no connection with status 0 and no error
    init({ lastUsedPath: 'http://127.0.0.1:1/used/{{projectId}}/{{version}}/{{lng}}/{{ns}}', debounceSubmit: 150 })
    const errors = []
    lastUsed.used('z', 'k', (err) => errors.push(err))
    await wait(230)
    expect(errors.length).to.be(1)
    expect(errors[0]).to.be.ok()
    expect(lastUsed.pending.z.k).to.be(2) // waiting for its one retry
    await wait(400)
    expect(Object.keys(lastUsed.pending)).to.eql([])
  })

  it('calls the callbacks still waiting when init() is called again', async () => {
    init()
    const errors = []
    lastUsed.used('r', 'k', (err) => errors.push(err))
    init()
    expect(errors.length).to.be(1)
    expect(errors[0].message).to.contain('init() was called again')
    await wait(150)
    expect(received).to.eql([])
  })

  it('keeps a namespace named __proto__ a plain entry', async () => {
    init()
    lastUsed.used('__proto__', 'polluted')
    expect(({}).polluted).to.be(undefined)
    await wait(250)
  })
})
