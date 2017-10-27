'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _log4js = require('log4js');

var _log4js2 = _interopRequireDefault(_log4js);

var _motionDetection = require('./motion-detection');

var _motionDetection2 = _interopRequireDefault(_motionDetection);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var mqtt = require('mqtt');

var logger = _log4js2.default.getLogger("Detector");

function noop() {}

/**
 * Detector class.
 *
 * @class
 */

var Detector = function () {
  function Detector(_ref) {
    var srcimg_url = _ref.srcimg_url,
        mqtt_url = _ref.mqtt_url,
        mqtt_topic = _ref.mqtt_topic,
        polling_interval = _ref.polling_interval;

    _classCallCheck(this, Detector);

    this.srcimg_url = srcimg_url;
    this.mqtt = null;
    this.mqtt_url = mqtt_url;
    this.mqtt_topic = mqtt_topic;
    this.polling_interval = polling_interval;

    this.motionDetection = new _motionDetection2.default();
    this.intervalObj = null;
  }

  /**
   * start processing
   *
   * This will poll image, detect motion, then publish result to mqtt broaker
   *
   * @method Detector#start
   */


  _createClass(Detector, [{
    key: 'start',
    value: function start() {
      var _this = this;

      return new Promise(function (resolv, reject) {
        _this.mqtt = mqtt.connect(_this.mqtt_url);

        _this.mqtt.on('connect', function () {
          logger.info('connected to MQTT broaker : ' + _this.mqtt_url);
          _this._startPolling().then(function () {
            logger.info('polling to ' + _this.srcimg_url + ' started every ' + _this.polling_interval + ' msec');
            resolv();
          }).catch(function (err) {
            return logger.error(err.message);
          });
        });

        // to avoid flow Error, we will check existence of this.mqtt
        if (_this.mqtt) _this.mqtt.on('error', function (err) {
          return reject(err);
        });
      });
    }

    /**
     * stop analyzer
     *
     * @method Detector#stop
     * @returns {Promise<void>}
     *
     */

  }, {
    key: 'stop',
    value: function stop() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (_this2.intervalObj) {
          clearInterval(_this2.intervalObj);
          _this2.intervalObj = null;
        }

        if (_this2.mqtt) {
          _this2.mqtt.end(true, function () {
            _this2.mqtt = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    /**
     * start analyzer
     *
     * @returns {Promise<void>}
     * @private
     */

  }, {
    key: '_startPolling',
    value: function _startPolling() {
      var _this3 = this;

      this.intervalObj = setInterval(function (ev) {
        _this3._fetchImg().then(function (img) {
          return _this3._detectMotion(img);
        }).then(function (res) {
          return _this3._publishMqtt(res);
        }).catch(function (err) {
          return logger.warn(err.message);
        });
      }, this.polling_interval);

      return Promise.resolve();
    }

    /**
     * fetch image
     *
     * @returns{Promsie<Object>} - jpeg blob object
     * @private
     */

  }, {
    key: '_fetchImg',
    value: function _fetchImg() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        (0, _nodeFetch2.default)(_this4.srcimg_url).then(function (res) {
          return res.buffer();
        }).then(function (jpg) {
          return resolve(jpg);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }

    /**
     * detect motion
     *
     * @params {Object} img - image object
     * @returns {Promise<Object}> - promise return motion-detection result
     * @private
     */

  }, {
    key: '_detectMotion',
    value: function _detectMotion(img) {
      var _this5 = this;

      var st = Date.now();
      return new Promise(function (resolve, reject) {
        _this5.motionDetection.detect(img).then(function (res) {
          var now = Date.now();
          resolve(res);
        }).catch(function (err) {
          return reject(err);
        });
      });
    }

    /**
     * publish to mqtt broaker
     *
     * @params {Object} obj - arbitrary result object
     * @returns {Promise<void>}
     */

  }, {
    key: '_publishMqtt',
    value: function _publishMqtt(obj) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        var mesg = JSON.stringify(obj);
        if (_this6.mqtt) {
          _this6.mqtt.publish(_this6.mqtt_topic, mesg, function (err) {
            if (!err) resolve();else reject(err);
          });
        } else {
          reject(new Error('this.mqtt is null'));
        }
      });
    }
  }]);

  return Detector;
}();

exports.default = Detector;