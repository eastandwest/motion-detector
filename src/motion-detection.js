//@flow

import cv from 'opencv'
import express from 'express'
import path from 'path'
import fs   from 'fs'

const app = express()

/**
 * Motion Detection class.
 *
 * This class will compare previous image, then compare each pixel after gray and gaussian processing.
 * After that, it will be applied threshold processing, then calcurate score by obtaining average of each pixel value.
 *
 * @class
 *
 * @property {?Buffer} prev - previous image
 * @property {number} port - port number of test web server, currently hard coded with 20000
 * @property {object} app   - express object for test web server
 * @property {string} imgDir - the directory which will store intermidiate image for debugging
 *
 * @example
 *
 * const md = new MotionDetection()
 * md.detect(jpg0).then( obj => {
 *   // #=> {jpg: jpg0, score: 0, contours: null}
 * )
 *
 * md.detect(jpg1).then(obj => {
 *   // #=> {jpg: jpg1, score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...] }
 *   // when score is zero which means not motion detected, contours will be null
 * })
 */
class MotionDetection {
  prev: ?Buffer
  port: number
  app: Object
  imgDir: string

  constructor() {
    this.prev = null
    this.port = 20000
    this.app = express()
    this.imgDir = path.join(__dirname, "../images")
  }

  /**
   * do motion detection
   *
   * @params {Buffer} jpg - jpg image
   * @method MotionDetection#detect
   * @returns {Promise<{img: Buffer, score: number, contours: Array<{x: number, y: number, width: number, height:number>|null}>}
   *
   * @examples
   * md.detect(jpg).then(obj => {
   *   // #=> {jpg: [jpg data], score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...] }
   * })
   */
  detect(jpg: Buffer):Promise<{img: Buffer, score: number, contours: Array<{x: number, y: number, width: number, height:number}>}> {
    return new Promise((resolv, reject) => {
      cv.readImage(jpg, (err, mat) => {
        if(err) {
          reject(err)
        } else {
          let score = 0, contours = []

          // pre-processing
          // grayscale then blur to eliminate noise
          mat.convertGrayscale()
          mat.gaussianBlur([11, 11], 0)

          if(this.prev) {
            // create differetiation image
            const diff = mat.copy()
            diff.absDiff(this.prev, mat)
            const th = diff.threshold( 25, 255, "Binary")
            // th.save(this.imgDir+"/diff.jpg")  please comment out while debugging

            score = this._calcScore(th)
            contours = this._getContoursBoundaries(th)
          }
          this.prev = mat

          resolv({ img: jpg, score, contours})
        }
      })
    })
  }

  /**
   * calcurate motion detection score
   *
   * score is simply calcurated by average of each pixel
   *
   * @params {Object} mat - Matrix object
   * @method MotionDetection#_calcScore
   * @returns {number} - score
   * @private
   */
  _calcScore(mat: Object): number {
    const buff = mat.getData()

    let score = 0
    for(let i = 0, l = buff.length; i < l; i++ ) {
      score += buff.readUInt8(i)
    }
    score /= buff.length

    return score
  }

  /**
   * get countours boundaries
   *
   * @param {Object} mat - Matrix object (we'll assume threshold processed)
   * @method MotionDetection#_getContoursBoundaries
   * @return {Array<{x, y, width, height}>}
   * @private
   */
  _getContoursBoundaries(mat: Object): Array<{x: number, y: number, width: number, height: number}> {
    let ret = []

    const cont = mat.copy().findContours()
    for(let i = 0, l = cont.size(); i < l; i++) {
      ret.push(cont.boundingRect(i))
    }
    return ret
  }

  /**
   * get active boundary
   *
   * currently, this method is not used. but, for future use, we'll reamin it.
   *
   * @params {Object} mat - Matrix object (we'll assume threshold processed)
   * @method MotionDetection#_getActiveBoundary
   * @return {Object|Null} - ret {x, y, width, height}
   * @private
   */
  _getActiveBoundary(mat: Object): {x: number, y: number, width: number, height: number}|null {
    const cont = mat.copy().findContours()

    const _r = {x0: 640, y0: 480, x1: 0, y1: 0}
    const _l = cont.size()

    for(let i = 0; i < _l; i++) {
      let b = cont.boundingRect(i)
      let x0 = b.x, y0 = b.y, x1 = b.x + b.width, y1 = b.y + b.height

      _r.x0 = ( _r.x0 < x0 ) ? _r.x0 : x0
      _r.x1 = ( _r.x1 > x1 ) ? _r.x1 : x1
      _r.y0 = ( _r.y0 < y0 ) ? _r.y0 : y0
      _r.y1 = ( _r.y1 > y1 ) ? _r.y1 : y1
    }

    return _l > 0 ? {x: _r.x0, y: _r.y0, width: _r.x1 - _r.x0, height: _r.y1 - _r.y0 } : null
  }


  /**
   * test web server for debugging
   *
   * @params {number} port
   * @private
   */
  _startTestServer(port: number) {
    this.app.get('/', (req, res) => res.send('It works!!'))
    this.app.get('/:img', (req, res) => {
      res.set('Content-Type', 'image/jpeg').send(fs.readFileSync( this.imgDir + "/" + req.params.img + ".jpg" ))
    })

    this.app.listen(port, () => {
      console.log("test server started :", port)
    })
  }


}

export default MotionDetection
