import expect from 'expect.js'
import jsonServer from 'json-server'
let js

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

  js.use(jsonServer.defaults())
  js.listen(6001, () => {
    console.log('JSON Server is running')
    done(null, js)
  })
}

export default server
