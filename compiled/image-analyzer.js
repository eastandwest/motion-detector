'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _log4js = require('log4js');

var _log4js2 = _interopRequireDefault(_log4js);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _result = require('./result');

var _result2 = _interopRequireDefault(_result);

var _plugin = require('./plugin');

var _plugin2 = _interopRequireDefault(_plugin);

var _motionDetection = require('./motion-detection');

var _motionDetection2 = _interopRequireDefault(_motionDetection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_log4js2.default.level = 'debug';
var logger = _log4js2.default.getLogger("ImageAnalyzer");

function noop() {}

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

var ImageAnalyzer = function () {
  function ImageAnalyzer() {
    _classCallCheck(this, ImageAnalyzer);

    this.interval = null;
    this.plugins = [];
    this.analyzeTimeout = 850;
    this.motionDetection = new _motionDetection2.default();
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


  _createClass(ImageAnalyzer, [{
    key: 'start',
    value: function start(plugins, generator_url, publisher_url, interval) {
      var _this = this;

      return new Promise(function (resolv, reject) {
        _this._setPlugins(plugins).then(function () {
          return _this._startAnalyzer(generator_url, publisher_url, interval);
        }).then(function () {
          return resolv();
        }).catch(function (err) {
          return logger.error(err.message);
        });
      });
    }

    /**
     * stop analyzer
     *
     * @method ImageAnalyzer#stop
     *
     */

  }, {
    key: 'stop',
    value: function stop() {
      this.plugins = [];
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
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

  }, {
    key: '_setPlugins',
    value: function _setPlugins(plugins) {
      var _this2 = this;

      return new Promise(function (resolv, reject) {
        if (plugins instanceof Array) {
          plugins.filter(function (plugin) {
            try {
              return new _plugin2.default(plugin.name, plugin.url);
            } catch (err) {
              logger.warn('_setPlugins: "' + err.message + '"');
              return false;
            }
          }).forEach(function (pluginObj) {
            return _this2.plugins.push(pluginObj);
          });

          resolv();
        } else {
          reject(new Error('plugins MUST be Array of object'));
        }
      });
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

  }, {
    key: '_startAnalyzer',
    value: function _startAnalyzer(generator_url, publisher_url, interval) {
      var _this3 = this;

      this.interval = setInterval(function (ev) {
        _this3._fetchThenAnalyzeThenPublish(generator_url, publisher_url).then(function () {
          logger.info('analytics finished within this period');
        }).catch(function (err) {
          return logger.warn(err.message);
        });
      }, interval);

      return Promise.resolve();
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

  }, {
    key: '_fetchThenAnalyzeThenPublish',
    value: function _fetchThenAnalyzeThenPublish(generator_url, publisher_url) {
      var _this4 = this;

      var _validation = function _validation(url) {
        if (typeof url !== 'string') return new Error('_fetchThenAnalyzeThenPublish: url MUST be string');

        if (!url.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+$/)) return new Error('_fetchThenAnalyzeThenPublish: param url is not proper url string');
      };

      return new Promise(function (resolv, reject) {
        var err = _validation(generator_url) || _validation(publisher_url);
        if (err) {
          reject(err);
        } else {
          (0, _nodeFetch2.default)(generator_url).then(function (res) {
            return res.buffer();
          }).then(function (jpg) {
            return _this4.motionDetection.detect(jpg);
          }).then(function (obj) {
            return _this4._analyze(obj);
          }).then(function (res) {
            return _this4._sendPublisher(publisher_url, res);
          }).then(function () {
            return resolv();
          }).catch(function (err) {
            reject(err);
          });
        }
      });
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

  }, {
    key: '_analyze',
    value: function _analyze(_ref) {
      var _this5 = this;

      var img = _ref.img,
          score = _ref.score,
          contours = _ref.contours;

      return new Promise(function (resolv, reject) {
        var detected = {
          md_score: score,
          md_contours: contours
        };

        if (!img instanceof Buffer) {
          reject(new Error('jpg must be Buffer object'));
          return;
        }
        if (_this5.plugins.length === 0) {
          resolv(new _result2.default(img, {}));
        } else {
          _this5.plugins.forEach(function (plugin) {
            (0, _nodeFetch2.default)(plugin.url, { method: 'POST', headers: { 'content-type': 'image/jpg' }, body: img }).then(function (res) {
              if (res.status === 200) return res.json();else logger.warn('_analyze: status = ' + res.status + ' when requesting ' + plugin.url);
            }).then(function (json) {
              if (json && json.length > 0) detected = Object.assign({}, detected, _defineProperty({}, plugin.name, json));
            }).catch(function (err) {
              return logger.warn('_analyze: "' + err.message + '"');
            });
          });

          setTimeout(function (ev) {
            var result = new _result2.default(img, detected);
            resolv(result);
          }, _this5.analyzeTimeout);
        }
      });
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

  }, {
    key: '_sendPublisher',
    value: function _sendPublisher(url, result) {
      var _validation = function _validation(url, result) {
        if (typeof url !== 'string') return new Error('_sendPublisher: url MUST be string');

        if (!url.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+$/)) return new Error('_sendPublisher: param url is not proper url string');

        if (!(result instanceof _result2.default)) return new Error('_sendPublisher: param result MUST be result object');
      };

      return new Promise(function (resolv, reject) {
        var err = _validation(url, result);
        if (err) {
          reject(err);
        } else if (result.num_keys === 0) {
          // num_keys equal 0 means nothing detected, so we'll do nothing :)
          resolv();
        } else {
          var json = {
            base64img: result.base64Image(),
            detected: result.detected
          };
          (0, _nodeFetch2.default)(url, { method: 'POST', body: JSON.stringify(json), headers: { 'content-type': 'application/json' } }).then(function (res) {
            if (res.status === 200) resolv();else reject(new Error('_sendPublisher: plugin(' + url + ') returns status equal ' + res.status));
          }).catch(function (err) {
            return reject(err);
          });
        }
      });
    }
  }]);

  return ImageAnalyzer;
}();

exports.default = ImageAnalyzer;