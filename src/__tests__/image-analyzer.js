import ImageAnalyzer from '../image-analyzer'
import express       from 'express'
import bodyParser    from 'body-parser'
import path          from 'path'
import fs            from 'fs'

const jpg = fs.readFileSync( path.join(__dirname + "/testImages/face0.jpg"))

class TestServer {
  constructor(port) {
    this.port = port
    this.app = express()

    const options = {
      limit: '1mb',  // to receive image data
      type: 'application/json'
    }
    this.app.use(bodyParser.raw(options))

    this.server = null

    // emulate generator
    this.app.get('/generator', (req, res) => {
      res.set('Content-Type', 'image/jpg').send(jpg)
    })

    // emulate analyzer
    this.app.post('/analyzer', (req, res) => {
      res.send([{x: 10, y: 10, width: 50, height: 50}])
    })

    this.app.post('/analyzer/500', (req, res) => {
      res.status(500).send({text: 'error'})
    })

    // emulate delayed analyzer
    this.app.post('/analyzer/delay/:time', (req, res) => {
      const delay = parseInt(req.params.time)
      setTimeout(ev => {
        res.send([{x: 10, y: 10, width: 50, height: 50}])
      }, delay)
    })

    // emulate publisher
    // it will echo raw img data from base64 encoded one.
    this.app.post('/publisher', (req, res) => {
      const result = JSON.parse(req.body.toString())

      if(result.base64img && result.detected) res.send('ok')
      else res.status(400).send('property img or detected missing')
    })
  }

  start(){
    return new Promise((resolv, reject) => {
      this.server = this.app.listen(this.port, () => { resolv() })
    })
  }

  stop() {
    if(this.server) {
      this.server.close()
      this.server = null
    }
  }
}

describe('constructor test', () => {
  it('will create instance', () => {
    expect(new ImageAnalyzer()).toBeInstanceOf(ImageAnalyzer)
  })
})

describe('_setPlugins test', () => {
  let analyzer

  beforeEach(() => {
    analyzer = new ImageAnalyzer()
  })
  afterEach(() => {
    analyzer = null
  })

  it('will set plugins property, when param is correct', done => {
    analyzer._setPlugins([{name: "test", url: "http://somewhere/"}, {name: "test2", url: "http://somewhere2"}])
      .then(res => {
        expect(res).toBeUndefined()
        expect(analyzer.plugins).toHaveLength(2)
        done()
      })
  })

  it('will reject, when parameter is not Array', done => {
    analyzer._setPlugins('plugins')
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })

  it('will not set plugins, when parameter does not include proper object in Array',done => {
    analyzer._setPlugins([{name: "t", url2: "hoge"}, "hoge", 1, {name: 0, url: "http://hoge/"}, {name:"tt", url:123}])
      .then(() => {
        expect(analyzer.plugins).toHaveLength(0)
        done()
      })
  })
})

describe('_analyze test', () => {
  let analyzer
  const testServer = new TestServer(10020)
  beforeEach(() => {
    analyzer = new ImageAnalyzer()
    testServer.start()
  })

  afterEach(() => {
    analyzer = null
    testServer.stop()
  })

  it('will analyze jpg data for each specified plugins', done => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"},
      {name: "analyze1", url: "http://localhost:10020/analyzer"}
    ]

    analyzer._setPlugins(plugins)
      .then( () => {
        analyzer._analyze({img:jpg, score: 1, rect: {}})
          .then(result => {
            expect(result.img).toBe(jpg)
            expect(result.detected).toHaveProperty("analyze0")
            expect(result.detected).toHaveProperty("analyze1")
            done()
          })
      })
  })

  it('will return analyze data within timeout period (default 300msec)', done => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"},
      {name: "analyze1", url: "http://localhost:10020/analyzer/delay/1500"}
    ]
    analyzer._setPlugins(plugins)
      .then( () => {
        analyzer._analyze({img: jpg, score: 1, rect: {}})
          .then(result => {
            expect(result.img).toBe(jpg)
            expect(result.detected).toHaveProperty("analyze0")
            expect(result.detected).not.toHaveProperty("analyze1")
            done()
          })
      })
  })
  it('will return analyze data which include only status = 200 and json data', done => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"},
      {name: "analyze1", url: "http://localhost:10020/analyzer/404"},
      {name: "analyze2", url: "http://localhost:10020/analyzer/500"}
    ]
    analyzer._setPlugins(plugins)
      .then( () => {
        analyzer._analyze({img: jpg, score: 1, rect: {}})
          .then(result => {
            expect(result.img).toBe(jpg)
            expect(result.detected).toHaveProperty("analyze0")
            expect(result.detected).not.toHaveProperty("analyze1")
            expect(result.detected).not.toHaveProperty("analyze2")
            done()
          })
      })
  })
})

describe('_sendPublisher test', () => {
  let analyzer
  const testServer = new TestServer(10020)
  beforeEach(() => {
    analyzer = new ImageAnalyzer()
    testServer.start()
  })

  afterEach(() => {
    analyzer = null
    testServer.stop()
  })

  it('will analyze jpg data for each specified plugins', done => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"}
    ]
    const publisher = 'http://localhost:10020/publisher'

    analyzer._setPlugins(plugins)
      .then(() => analyzer._analyze({img:jpg, score: 0, rect: null}))
      .then(res => analyzer._sendPublisher(publisher, res))
      .then(res => {
        expect(res).toBeUndefined()
        done()
      })
  })

  it('will reject when publisher_url is not string', done => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"}
    ]
    const publisher = 0

    analyzer._setPlugins(plugins)
      .then(() => analyzer._analyze({img:jpg, score:0, rect: null}))
      .then(res => analyzer._sendPublisher(publisher, res))
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject when publisher_url is not proper url string', done => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"}
    ]
    const publisher = 'hoge'

    analyzer._setPlugins(plugins)
      .then(() => analyzer._analyze({img: jpg, score: 0, rect: null}))
      .then(res => analyzer._sendPublisher(publisher, res))
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject when result is not Response Object', () => {
    const plugins = [
      {name: "analyze0", url: "http://localhost:10020/analyzer"}
    ]
    const publisher = 'http://localhost:10020/publisher'

    analyzer._setPlugins(plugins)
      .then(() => analyzer._analyze({img: jpg, score: 0, rect: null}))
      .then(res => analyzer._sendPublisher(publisher, {}))
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
})


describe('_fetchThenAnalyzeThenPublish test', () => {
  let analyzer
  const testServer = new TestServer(10020)
  beforeEach(() => {
    analyzer = new ImageAnalyzer()
    testServer.start()
  })

  afterEach(() => {
    analyzer = null
    testServer.stop()
  })
  const plugins = [
    {name: "analyze0", url: "http://localhost:10020/analyzer"}
  ]
  const generator = 'http://localhost:10020/generator'
  const publisher = 'http://localhost:10020/publisher'


  it('will resolv, when urls are proper', done => {
    analyzer._setPlugins(plugins)
      .then( () => analyzer._fetchThenAnalyzeThenPublish(generator, publisher) )
      .then( res => {
        expect(res).toBeUndefined()
        done()
      })
      .catch(err => {
        console.warn(err)
        done()
      })
  })

  it('will reject, when generator_url is not string', done => {
    analyzer._setPlugins(plugins)
      .then( () => analyzer._fetchThenAnalyzeThenPublish(0, publisher) )
      .catch( err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject, when generator_url is not proper url string', done => {
    analyzer._setPlugins(plugins)
      .then( () => analyzer._fetchThenAnalyzeThenPublish("hoge", publisher) )
      .catch( err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject, when publisher_url is not string', done => {
    analyzer._setPlugins(plugins)
      .then( () => analyzer._fetchThenAnalyzeThenPublish(generator, 0) )
      .catch( err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject, when publisher_url is not proper url string', done => {
    analyzer._setPlugins(plugins)
      .then( () => analyzer._fetchThenAnalyzeThenPublish(generator, "hoge") )
      .catch( err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
})

describe('start and stop test', () => {
  let analyzer
  const testServer = new TestServer(10020)
  beforeEach(() => {
    analyzer = new ImageAnalyzer()
    testServer.start()
  })

  afterEach(() => {
    analyzer = null
    testServer.stop()
  })
  const plugins = [
    {name: "analyze0", url: "http://localhost:10020/analyzer"}
  ]
  const generator = 'http://localhost:10020/generator'
  const publisher = 'http://localhost:10020/publisher'


  it('will start then stop', done => {
    analyzer.start(plugins, generator, publisher, 1000)
      .then(() => {
        expect(analyzer.interval).toBeGreaterThanOrEqual(0)
        analyzer.stop()
        expect(analyzer.interval).toBeNull()
        done()
      }).catch(err => console.warn(err))
  })
})
