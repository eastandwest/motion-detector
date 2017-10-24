import log4js from 'log4js'
import yaml   from 'node-yaml'

import ImageAnalyzer from './image-analyzer'
import OpenCVAnalyzer from './opencv-analyzer'

log4js.level = 'debug'
const logger = log4js.getLogger()


//////////////////////////////////////////////////////
// load conf
const CONFIGFILE = __dirname + '/../conf/config.yaml'
const conf = yaml.readSync(CONFIGFILE)

//////////////////////////////////////////////////////
// start analyzer
//
const faceAnalyzer = new OpenCVAnalyzer()
const fullbodyAnalyzer = new OpenCVAnalyzer()

const imageAnalyzer = new ImageAnalyzer()

faceAnalyzer.startAnalyzer(10000, "FACE_CASCADE")
  .then(() => fullbodyAnalyzer.startAnalyzer(10001, "FULLBODY_CASCADE"))
  .then(() => imageAnalyzer.start(
    conf.plugins,
    conf.generator,
    conf.publisher,
    conf.interval
  ))
  .then(() => logger.info('image analyzer started'))
  .catch(err => {
    console.warn(err.message)
    process.exit()
  })


