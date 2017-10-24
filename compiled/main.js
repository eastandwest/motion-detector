'use strict';

var _log4js = require('log4js');

var _log4js2 = _interopRequireDefault(_log4js);

var _nodeYaml = require('node-yaml');

var _nodeYaml2 = _interopRequireDefault(_nodeYaml);

var _imageAnalyzer = require('./image-analyzer');

var _imageAnalyzer2 = _interopRequireDefault(_imageAnalyzer);

var _opencvAnalyzer = require('./opencv-analyzer');

var _opencvAnalyzer2 = _interopRequireDefault(_opencvAnalyzer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_log4js2.default.level = 'debug';
var logger = _log4js2.default.getLogger();

//////////////////////////////////////////////////////
// load conf
var CONFIGFILE = __dirname + '/../conf/config.yaml';
var conf = _nodeYaml2.default.readSync(CONFIGFILE);

//////////////////////////////////////////////////////
// start analyzer
//
var faceAnalyzer = new _opencvAnalyzer2.default();
var fullbodyAnalyzer = new _opencvAnalyzer2.default();

var imageAnalyzer = new _imageAnalyzer2.default();

faceAnalyzer.startAnalyzer(10000, "FACE_CASCADE").then(function () {
  return fullbodyAnalyzer.startAnalyzer(10001, "FULLBODY_CASCADE");
}).then(function () {
  return imageAnalyzer.start(conf.plugins, conf.generator, conf.publisher, conf.interval);
}).then(function () {
  return logger.info('image analyzer started');
}).catch(function (err) {
  console.warn(err.message);
  process.exit();
});