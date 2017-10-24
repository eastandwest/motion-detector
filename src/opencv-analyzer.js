// @flow

import cv from 'opencv'
import fs from 'fs'
import RestServer from './rest-server'


/**
 * OpenCVAnalyzer
 *
 * This will create REST server for jpeg analyze feature using OpenCV.
 *
 * @example
 * fetch('http://localhost:10022/detect', {
 *   method: 'post',
 *   body: jpeg_data,
 *   'content-type': 'image/jpg'
 * }).then(res => res.json())
 * }).then(json => {
 *   // #=> [ { x: 141, y: 132, width: 224, height: 224 } ]
 * })
 *
 * @class
 */
class OpenCVAnalyzer extends RestServer {
  classifier: string

  constructor() {
    super()
  }

  /**
   * start analyser server
   *
   * classifier should be one of
   *   FACE_CASCADE, EYE_CASCADE, EYEGLASSES_CASCADE, FULLBODY_CASCADE, CAR_SIDE_CASCADE
   * or classifier file.
   *
   * @method OpenCVAnalyzer#startAnalyzer
   *
   * @example
   * const faceAnalyzer = new OpenCVAnalyzer()
   * faceAnalyzer.startAnalyzer(10022, "FACE_CASCADE")
   *   .then(() => {
   *     console.log("start face analyzer on port 10022")
   *
   *     fetch('http://localhost:10022/detect', {
   *       method: 'post',
   *       body: jpeg_data,
   *       'content-type': 'image/jpg'
   *     }).then(res => res.json())
   *     }).then(json => {
   *       // #=> [ { x: 141, y: 132, width: 224, height: 224 } ]
   *     })
   *   })
   *
   * @param {number} port - port number
   * @param {string} classifier - classifier
   * @return {Promise<void>}
   */
  startAnalyzer(port: number, classifier: string) {
    return new Promise((resolv, reject) => {
      if(typeof(classifier) !== 'string') {
        reject(new Error("param classifier MUST be string"))
      } else {
        this.classifier = cv[classifier] || classifier

        fs.stat(this.classifier, (err, stats) => {
          if(err) {
            reject(new Error(err.message))
          } else {
            this.start(port)
              .then(() => resolv())
              .catch(err => reject(err))
          }
        })
      }
    })
  }

  /**
   * Implementation of setCustormRouter()
   *
   * @method OpenCVAnalyzer#setCustormRouter
   *
   * @private
   */
  setCustomRoute(): void {
    this.app.post('/detect', (req, res) => {
      // req.body is JPEG image
      //
      // todo : check jpeg image
      const jpeg = req.body

      cv.readImage(jpeg, (err, im) => {
        if(!err) {
          im.convertGrayscale()
          im.gaussianBlur([5, 5], 0)
          im.detectObject(this.classifier, {}, (err, result) => {
            if(!err) {
              res.send(result)
            } else {
              res.status(500).send(err.message)
            }
          })
        } else {
          res.status(500).send(err.message)
        }
      })
    })
  }
}

export default OpenCVAnalyzer
