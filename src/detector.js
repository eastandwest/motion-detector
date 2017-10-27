//@flow

import log4js from 'log4js'
import MotionDetection from './motion-detection'
import fetch from 'node-fetch'
const mqtt = require('mqtt')

const logger = log4js.getLogger("Detector")

function noop() { }

/**
 * Detector class.
 *
 * @class
 */
class Detector {
  srcimg_url: string
  mqtt: null|Object
  mqtt_url: string
  mqtt_topic: string
  polling_interval: number
  motionDetection: Object
  intervalObj: null|number

  constructor({srcimg_url, mqtt_url, mqtt_topic, polling_interval} : {srcimg_url: string, mqtt_url: string, mqtt_topic: string, polling_interval: number}) {
    this.srcimg_url = srcimg_url
    this.mqtt = null
    this.mqtt_url = mqtt_url
    this.mqtt_topic = mqtt_topic
    this.polling_interval = polling_interval

    this.motionDetection = new MotionDetection()
    this.intervalObj = null
  }

  /**
   * start processing
   *
   * This will poll image, detect motion, then publish result to mqtt broaker
   *
   * @method Detector#start
   */
  start(): Promise<void> {
    return new Promise((resolv, reject) => {
      this.mqtt = mqtt.connect(this.mqtt_url)

      this.mqtt.on('connect', () => {
        logger.info(`connected to MQTT broaker : ${this.mqtt_url}`)
          this._startPolling()
            .then(() => {
              logger.info(`polling to ${this.srcimg_url} started every ${this.polling_interval} msec`)
                resolv()
            })
            .catch(err => logger.error(err.message))
      })

      // to avoid flow Error, we will check existence of this.mqtt
      if(this.mqtt) this.mqtt.on('error', err => reject(err))
    })
  }

  /**
   * stop analyzer
   *
   * @method Detector#stop
   * @returns {Promise<void>}
   *
   */
  stop(): Promise<void> {
    return new Promise( (resolve, reject) => {
      if(this.intervalObj) {
        clearInterval(this.intervalObj)
        this.intervalObj = null
      }

      if(this.mqtt) {
        this.mqtt.end(true, () => {
          this.mqtt = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * start analyzer
   *
   * @returns {Promise<void>}
   * @private
   */
  _startPolling(): Promise<void> {
    this.intervalObj = setInterval(ev => {
      this._fetchImg()
        .then( img => this._detectMotion(img))
        .then( res => this._publishMqtt(res))
        .catch(err => logger.warn(err.message))
    }, this.polling_interval)

    return Promise.resolve()
  }

  /**
   * fetch image
   *
   * @returns{Promsie<Object>} - jpeg blob object
   * @private
   */
  _fetchImg(): Promise<Object> {
    return new Promise((resolve, reject) => {
      fetch( this.srcimg_url )
        .then( res => res.buffer() )
        .then( jpg => resolve(jpg) )
        .catch( err => reject(err) )
    })
  }

  /**
   * detect motion
   *
   * @params {Object} img - image object
   * @returns {Promise<Object}> - promise return motion-detection result
   * @private
   */
  _detectMotion(img: Object): Promise<Object> {
    const st = Date.now()
    return new Promise( (resolve, reject) => {
      this.motionDetection.detect(img)
        .then( res => {
          const _res = Object.assign({}, {score: res.score, box: res.box})
          console.log(_res)
          const now = Date.now()
          resolve(_res)
        })
        .catch( err => reject(err) )
    })
  }

  /**
   * publish to mqtt broaker
   *
   * @params {Object} obj - arbitrary result object
   * @returns {Promise<void>}
   */
  _publishMqtt(obj: Object) {
    return new Promise( (resolve, reject) => {
      const mesg = JSON.stringify(obj)
      if(this.mqtt) {
        this.mqtt.publish(this.mqtt_topic, mesg, err => {
          if(!err) resolve()
          else reject(err)
        })
      } else {
        reject(new Error('this.mqtt is null'))
      }
    })
  }
}

export default Detector

