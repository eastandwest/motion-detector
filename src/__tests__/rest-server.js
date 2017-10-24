import RestServer from '../rest-server'
import fetch from 'node-fetch'


describe('constructor', () => {
  it('will create RestServer', () => {
    expect(new RestServer()).toBeInstanceOf(RestServer)
  })
})

describe('start', () => {
  let server
  beforeEach(() => {
    server = new RestServer()
  })
  afterEach(() => {
    server.stop()
    server = null
  })

  it('will start REST server when port is number', done => {
    server.start(10020).then(() => {
      fetch('http://localhost:10020')
        .then(res => res.text())
        .then( text => {
          expect(text).toBe('It works!!')
          done()
        })
    })
  })

  it('will raise error when port is blank', done => {
    return server.start().catch(err => {
      expect(err).toBeInstanceOf(Error)
      done()
    })
  })
  it('will raise error when port is not number', done => {
    return server.start('10020').catch(err => {
      expect(err).toBeInstanceOf(Error)
      done()
    })
  })
})

describe('setCustomRoute', () => {
  class TestServer extends RestServer {
    constructor(){
      super()
    }

    setCustomRoute() {
      this.app.get('/test', (req, res) => {
        res.send('test')
      })
    }
  }
  let testserver
  beforeEach(() => {
    testserver = new TestServer()
  })
  afterEach(() => {
    testserver.stop()
    testserver = null
  })

  it('will create custom route', done => {

    testserver.start(10020)
      .then(() => fetch('http://localhost:10020/test'))
      .then(res => res.text())
      .then(text => {
        expect(text).toBe('test')
        done()
      })
  })
})
