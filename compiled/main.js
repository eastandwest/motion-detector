#!/usr/bin/env node
'use strict';

var _nodeYaml = require('node-yaml');

var _nodeYaml2 = _interopRequireDefault(_nodeYaml);

var _log4js = require('log4js');

var _log4js2 = _interopRequireDefault(_log4js);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _detector = require('./detector');

var _detector2 = _interopRequireDefault(_detector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _log4js2.default.getLogger();

//////////////////////////////////////////////////////
// load conf
var CONFIGFILE = __dirname + '/../conf/config.yaml';
var conf = _nodeYaml2.default.readSync(CONFIGFILE);

var srcimg_url = process.env.SRCIMG_URL || conf.srcimg.url;
var mqtt_host = process.env.MQTT_HOST || conf.mqtt.host;
var mqtt_port = process.env.MQTT_PORT || conf.mqtt.port;
var mqtt_topic = process.env.TOPIC || conf.mqtt.topic;
var polling_interval = process.env.POLLING_INTERVAL || conf.polling.interval;
var profile_url = process.env.PROFILE_URL || conf.profile_url;

var mqtt_url = 'mqtt://' + mqtt_host + ':' + mqtt_port;

//////////////////////////////////////////////////////
// start analyzer
//
var detector = new _detector2.default({ srcimg_url: srcimg_url, mqtt_url: mqtt_url, mqtt_topic: mqtt_topic, polling_interval: polling_interval });

(0, _nodeFetch2.default)(profile_url).then(function (res) {
  return res.json();
}).then(function (profile) {
  console.log(profile);
  return detector.start(profile.uuid);
}).then(function () {
  return logger.info('Motion Detector started');
}).catch(function (err) {
  console.warn(err.message);
  process.exit();
});