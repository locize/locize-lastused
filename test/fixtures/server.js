import expect from 'expect.js'
import jsonServer from 'json-server'
let js
export const received = []

const server = (done) => {
  if (js) return done(null, js)

  js = jsonServer.create()

  js.post('/used/test/latest/en/transl', (req, res) => {
    expect(req.body).not.to.eql({})
    res.jsonp({
      all: 'ok'
    })
  })

  js.post('/used/refused/latest/en/transl', (req, res) => {
    res.status(401).jsonp({
      name: 'AuthorizationError',
      type: 'authorizationError.apiKey.wrongRole',
      message: 'Unauthorized: ApiKey not authorized with role (readonly)!'
    })
  })

  // records what reaches it; the namespace `flaky` fails once with a 500
  let flakyFailed = false
  // `down` always fails with a 500 (and is recorded), `slow` answers after 300 ms
  js.post('/used/record/latest/en/:ns', jsonServer.bodyParser, (req, res) => {
    if (req.params.ns === 'flaky' && !flakyFailed) {
      flakyFailed = true
      return res.status(500).jsonp({ message: 'boom' })
    }
    received.push([req.params.ns, req.body])
    if (req.params.ns === 'down') return res.status(500).jsonp({ message: 'down' })
    if (req.params.ns === 'slow') return setTimeout(() => res.jsonp({ all: 'ok' }), 300)
    res.jsonp({ all: 'ok' })
  })

  js.use(jsonServer.defaults())
  js.listen(6001, () => {
    console.log('JSON Server is running')
    done(null, js)
  })
}

export default server
