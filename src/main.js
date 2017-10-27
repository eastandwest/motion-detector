import yaml   from 'node-yaml'
import log4js from 'log4js'

import Detector from './detector'

const logger = log4js.getLogger()


//////////////////////////////////////////////////////
// load conf
const CONFIGFILE = __dirname + '/../conf/config.yaml'
const conf = yaml.readSync(CONFIGFILE)

const srcimg_url = process.env.SRCIMG_URL || conf.srcimg.url
const mqtt_host = process.env.MQTT_HOST || conf.mqtt.host
const mqtt_port = process.env.MQTT_PORT || conf.mqtt.port
const mqtt_topic = process.env.TOPIC || conf.mqtt.topic
const polling_interval = process.env.POLLING_INTERVAL || conf.polling.interval

const mqtt_url = `mqtt://${mqtt_host}:${mqtt_port}`

//////////////////////////////////////////////////////
// start analyzer
//
const detector = new Detector({srcimg_url, mqtt_url, mqtt_topic, polling_interval})

detector.start()
  .then(() => logger.info('Motion Detector started'))
  .catch(err => {
    console.warn(err.message)
    process.exit()
  })
