import OpenCVAnalyzer from '../opencv-analyzer'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

describe('constructor test', () => {
  it('will create instance, when classifier is proper cascade name', () => {
    expect(new OpenCVAnalyzer()).toBeInstanceOf(OpenCVAnalyzer)
  })
})

describe('startAnalyzer test', () => {
  let analyzer

  beforeEach(() => {
    analyzer = new OpenCVAnalyzer()
  })

  afterEach(() => {
    analyzer.stop()
    analyzer = null
  })

  it('will resolv, when param port = number and classifier is proper cascade name', done => {
    analyzer.startAnalyzer(10020, "FACE_CASCADE")
      .then( res => {
        expect(res).toBeUndefined()
        done()
      })
      .catch(err => console.warn(err.massage))
  })

  it('will resolv, when param port = number and classifier xml exists', done => {
    analyzer.startAnalyzer(10020, path.join(__dirname, "cascades/haarcascade_profileface.xml"))
      .then( res => {
        expect(res).toBeUndefined()
        done()
      })
  })

  it('will reject, when param port is not number', done => {
    analyzer.startAnalyzer("ABC", path.join(__dirname, "cascades/haarcascade_profileface.xml"))
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject, when param classifier is not string', done => {
    analyzer.startAnalyzer(10020, 123)
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject, when param classifier is not correct cascade name', done => {
    analyzer.startAnalyzer(10020, path.join(__dirname, "INCORRECT_CASCADE"))
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
  it('will reject, when param classifier file is not exist', done => {
    analyzer.startAnalyzer(10020, path.join(__dirname, "/unexist.xml"))
      .catch(err => {
        expect(err).toBeInstanceOf(Error)
        done()
      })
  })
})

describe("classifier REST interface test", () => {
  const faceImagePath = path.join(__dirname, "testImages/face0.jpg")
  const bodyImagePath = path.join(__dirname, "testImages/body0.jpg")

  const face = fs.readFileSync(faceImagePath)
  const body = fs.readFileSync(bodyImagePath)

  let server

  beforeEach(() => {
    server = new OpenCVAnalyzer()
  })
  afterEach(() => {
    server.stop()
    server = null
  })


  it('will detect face', done => {
    server.startAnalyzer(10020, "FACE_CASCADE")
      .then(() => fetch('http://localhost:10020/detect', {
        method: 'post',
        body: face,
        headers: {
          'content-type': 'image/jpg'
        }
      }))
      .then(res => {
        return res.json()
      })
      .then(json => {
        expect(json).toBeInstanceOf(Array)
        expect(json).toHaveLength(1)
        done()
      })
  })

  it('will detect body', done => {
    server.startAnalyzer(10020, "FULLBODY_CASCADE")
      .then(() => fetch('http://localhost:10020/detect', {
        method: 'post',
        body: body,
        headers: {
          'content-type': 'image/jpg'
        }
      }))
      .then(res => {
        return res.json()
      })
      .then(json => {
        expect(json).toBeInstanceOf(Array)
        done()
      })
  })

  it('will detect profile face by specifing cascade file', done => {
    server.startAnalyzer(10020, path.join(__dirname, "cascades/haarcascade_profileface.xml"))
      .then(() => fetch('http://localhost:10020/detect', {
        method: 'post',
        body: face,
        headers: {
          'content-type': 'image/jpg'
        }
      }))
      .then(res => {
        return res.json()
      })
      .then(json => {
        expect(json).toBeInstanceOf(Array)
        expect(json).toHaveLength(1)
        done()
      })
  })
})
