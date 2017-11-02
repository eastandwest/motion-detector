//@flow

import cv from 'opencv'
import express from 'express'
import path from 'path'
import fs   from 'fs'
import kmeans from 'node-kmeans'

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
   * @returns {Promise<{img: Buffer, score: number, contours: Array<{x: number, y: number, width: number, height:number>|null}>, box: {x: number, y: number, width: number, height: number}>}
   *
   * @examples
   * md.detect(jpg).then(obj => {
   *   // #=> {jpg: [jpg data], score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...], box: {x: 10, y: 10, width: 20, height: 120} }
   * })
   */
  detect(jpg: Buffer):Promise<{img: Buffer, score: number, contours: Array<{x: number, y: number, width: number, height:number}>}> {
    return new Promise((resolv, reject) => {
      cv.readImage(jpg, (err, mat) => {
        if(err) {
          reject(err)
        } else {
          let score = 0, contours = [], box = {}

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
            this._getContoursClusters(contours)
              .then( clusters => resolv({ img: jpg, score, contours, clusters }) )
              .catch(err => reject(err))
          }
          this.prev = mat
        }
      })
    })
  }

  /**
   * get contours clusters
   *
   * @params {Array<object>} contours - array of contour object
   * @return {Object} - contours cluster object
   */
  _getContoursClusters(contours: Array<Object>):Promise<Object> {
    return new Promise((resolve, reject) => {
      if (contours.length === 0) {
        resolve({})
      } else {
        //let _vectors = contours.map(c => [ c.x + (c.width / 2), c.y + (c.height / 2) ])
        let _vectors = contours.map(c => [ c.x, c.y, c.width, c.height ])
        const K_MAX = 3
        const k = _vectors.length < K_MAX ? _vectors.length : K_MAX

        try {
          kmeans.clusterize(_vectors, {k}, (err, res) => {
            if(err) reject(err)
            else {
              const _res = res.map( obj => obj.clusterInd )
                .map( idxs => idxs.map( idx => contours[idx] ) )
                .map( cnts => this._calcBox( cnts ) )

              resolve(_res)
            }
          })
        } catch(err) {
          reject(err)
        }
      }
    })

  }

  /**
   * calucrate motion detection box
   * @private
   */
  _calcBox(contours: Array<Object>): Object {
    let x0 = -1, y0 = -1, x1 = -1, y1 = -1

    contours.forEach( c => {
      x0 = (x0 === -1 || c.x < x0) ? c.x : x0
      y0 = (y0 === -1 || c.y < y0) ? c.y : y0
      x1 = (x1 === -1 || x1 < (c.x + c.width)) ? c.x + c.width : x1
      y1 = (y1 === -1 || y1 < (c.y + c.height)) ? c.y + c.height : y1
    })

    return {x : x0, y: y0, width: (x1 - x0), height: (y1 - y0)}
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
