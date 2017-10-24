//@flow

import log4js from 'log4js'
import fetch  from 'node-fetch'

import Result from './result'
import Plugin from './plugin'

import MotionDetection from './motion-detection'

log4js.level = 'debug'
const logger = log4js.getLogger("ImageAnalyzer")

function noop() { }

/**
 * Image Analyzer class.
 *
 * It will create REST server for MediaStream Processor.
 * When it receives POST request which includes RGB8 format image from Processor,
 * it will analyze this image by anlyzer in plugins.
 * After that, it will response the result of analyze and POST results (JSON object
 * of analytic result and raw data image and box embeded image).
 *
 * @class
 */
class ImageAnalyzer {
  plugins: Array<Plugin>
  interval: null|number
  analyzeTimeout: number
  motionDetection: Object

  constructor() {
    this.interval = null
    this.plugins = []
    this.analyzeTimeout = 850
    this.motionDetection = new MotionDetection()
  }

  /**
   * start processing
   *
   * @param {number} port - port number
   * @param {string} generator_url - url of image generator
   * @param {string} publisher_url - url of image publisher
   * @param {number} interval - interval for retrieving image_processor_url in mili-seconds
   *
   * @example
   * const analyzer = new ImageAnalyzer()
   * const plugins = [
   *   { name: 'facedetection', url: 'http://localhost:10001/detect' }
   *   { name: 'bodydetection', url: 'http://localhost:10002/detect' }
   * ]
   * const generator_url = 'http://localhost:7000/image/current'
   * const publisher_url = 'http://localhost:7001/'
   * const interval = 1000 // 1 sec
   *
   * analyzer.start( plugins, generator_url, publisher_url, interval )
   *   .then(() => console.log('start'))
   *
   * // after that, this will get jpeg image from generator_url every 1sec.
   * // then, analyze it via pulgin servers.
   * // then, it will publish json object data shown below.
   *
   * {
   *   "base64img": <BASE64_ENCODED_IMG_DATA>,
   *   "detected" : {
   *     "facedetection": Array<Object>,
   *     "bodydetection": Array<Object>
   *   }
   * }
   *
   * @method ImageAnalyzer#start
   */
  start(plugins: Array<Object>, generator_url: string, publisher_url: string, interval: number): Promise<void> {
    return new Promise((resolv, reject) => {
      this._setPlugins(plugins)
        .then(() => this._startAnalyzer(generator_url, publisher_url, interval) )
        .then(() => resolv())
        .catch(err => logger.error(err.message))
    })
  }

  /**
   * stop analyzer
   *
   * @method ImageAnalyzer#stop
   *
   */
  stop(): void {
    this.plugins = []
    if(this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /**
   * set plugins
   *
   * @method ImageAnalyzer#_setPlugins
   * @param {Array<Object>} plugins
   * @returns {Promise<void>}
   * @private
   */
  _setPlugins(plugins: Array<Object>): Promise<void> {
    return new Promise((resolv, reject) => {
      if(plugins instanceof Array) {
        plugins.filter(plugin => {
            try {
              return new Plugin(plugin.name, plugin.url)
            } catch(err) {
              logger.warn(`_setPlugins: "${err.message}"`)
              return false
            }
          })
          .forEach(pluginObj => this.plugins.push(pluginObj))

        resolv()
      } else {
        reject(new Error('plugins MUST be Array of object'))
      }
    })
  }

  /**
   * start analyzer
   *
   * @param {string} generator_url - url of image processor
   * @param {string} publisher_url - url of image processor
   * @param {number} interval - interval for retrieving image in mili seconds
   * @method ImageAnalyzer#_startAnalyzer
   * @returns {Promise<void>}
   * @private
   */
  _startAnalyzer(generator_url: string, publisher_url: string, interval: number): Promise<void> {
    this.interval = setInterval(ev => {
      this._fetchThenAnalyzeThenPublish(generator_url, publisher_url)
        .then(() => { logger.info('analytics finished within this period')})
        .catch(err => logger.warn(err.message))
    }, interval)

    return Promise.resolve()
  }

  /**
   * fetch, then analyze, then publish
   *
   * @params {string} generator_url - url of image generator
   * @params {string} publisher_url - url of image publisher
   * @method ImageAnalyzer#_fetchThenAnalyze
   * @returns {Promise<void>}
   * @private
   */
  _fetchThenAnalyzeThenPublish(generator_url: string, publisher_url: string):Promise<void> {
    const _validation = (url: string): ?Error => {
      if(typeof(url) !== 'string')
        return new Error('_fetchThenAnalyzeThenPublish: url MUST be string')

      if(!url.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+$/))
        return new Error('_fetchThenAnalyzeThenPublish: param url is not proper url string')
    }

    return new Promise((resolv, reject) => {
      const err = _validation(generator_url) || _validation(publisher_url)
      if(err) {
        reject(err)
      } else {
        fetch(generator_url)
          .then(res => res.buffer())
          .then(jpg => this.motionDetection.detect(jpg))
          .then(obj => this._analyze(obj))
          .then(res => this._sendPublisher(publisher_url, res))
          .then(() => resolv())
          .catch(err => {
            reject(err)
          })
      }
    })
  }

  /**
   * analyze
   *
   * analyze image file by sending jpg image data to each analyze micro server
   * configured in config.yaml
   *
   * @method ImageAnalyzer#_analyze
   *
   * @params {object} jpg - jpg data
   * @returns {Promise<Result>}
   * @private
   */
  _analyze({img, score, contours}: {img: Buffer, score: number, contours: Object}): Promise<Result> {
    return new Promise((resolv, reject) => {
      let detected = {
        md_score: score,
        md_contours:  contours
      }

      if(! img instanceof Buffer) {
        reject(new Error('jpg must be Buffer object'))
        return
      }
      if(this.plugins.length === 0) {
        resolv(new Result(img, {}))
      } else {
        this.plugins.forEach(plugin => {
          fetch(plugin.url, { method: 'POST', headers: {'content-type': 'image/jpg'}, body: img })
            .then( res => {
              if(res.status === 200) return res.json()
              else logger.warn(`_analyze: status = ${res.status} when requesting ${plugin.url}`)
            })
            .then( json => {
              if(json && json.length > 0) detected = Object.assign({}, detected, { [plugin.name]: json })
            })
            .catch( err => logger.warn(`_analyze: "${err.message}"`))
        })

        setTimeout( ev => {
          const result = new Result(img, detected)
          resolv(result)
        }, this.analyzeTimeout)
      }
    })
  }

  /**
   * _sendPublisher
   *
   * send analyze result data to Publisher
   *
   * @method ImageAnalyzer#_sendPublisher
   *
   * @params {string} url - publisher url
   * @params {Result} result - result object
   * @returns {Promise<void>}
   * @private
   */
  _sendPublisher(url: string, result: Result): Promise<void> {
    const _validation = (url: string, result: Result): ?Error => {
      if( typeof(url) !== 'string' )
        return new Error('_sendPublisher: url MUST be string')

      if(!url.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+$/))
        return new Error('_sendPublisher: param url is not proper url string')

      if( !(result instanceof Result) )
        return new Error('_sendPublisher: param result MUST be result object')
    }

    return new Promise((resolv, reject) => {
      const err = _validation(url, result)
      if(err) {
        reject(err)
      } else if (result.num_keys === 0) {
        // num_keys equal 0 means nothing detected, so we'll do nothing :)
        resolv()
      } else {
        const json = {
          base64img: result.base64Image(),
          detected: result.detected
        }
        fetch(url, {method:'POST', body: JSON.stringify(json), headers: {'content-type': 'application/json'}})
          .then( res => {
            if(res.status === 200) resolv()
            else reject(new Error(`_sendPublisher: plugin(${url}) returns status equal ${res.status}`))
          })
          .catch(err => reject(err))
      }
    })
  }
}

export default ImageAnalyzer

