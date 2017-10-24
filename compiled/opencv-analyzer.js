'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _opencv = require('opencv');

var _opencv2 = _interopRequireDefault(_opencv);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _restServer = require('./rest-server');

var _restServer2 = _interopRequireDefault(_restServer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
var OpenCVAnalyzer = function (_RestServer) {
  _inherits(OpenCVAnalyzer, _RestServer);

  function OpenCVAnalyzer() {
    _classCallCheck(this, OpenCVAnalyzer);

    return _possibleConstructorReturn(this, (OpenCVAnalyzer.__proto__ || Object.getPrototypeOf(OpenCVAnalyzer)).call(this));
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


  _createClass(OpenCVAnalyzer, [{
    key: 'startAnalyzer',
    value: function startAnalyzer(port, classifier) {
      var _this2 = this;

      return new Promise(function (resolv, reject) {
        if (typeof classifier !== 'string') {
          reject(new Error("param classifier MUST be string"));
        } else {
          _this2.classifier = _opencv2.default[classifier] || classifier;

          _fs2.default.stat(_this2.classifier, function (err, stats) {
            if (err) {
              reject(new Error(err.message));
            } else {
              _this2.start(port).then(function () {
                return resolv();
              }).catch(function (err) {
                return reject(err);
              });
            }
          });
        }
      });
    }

    /**
     * Implementation of setCustormRouter()
     *
     * @method OpenCVAnalyzer#setCustormRouter
     *
     * @private
     */

  }, {
    key: 'setCustomRoute',
    value: function setCustomRoute() {
      var _this3 = this;

      this.app.post('/detect', function (req, res) {
        // req.body is JPEG image
        //
        // todo : check jpeg image
        var jpeg = req.body;

        _opencv2.default.readImage(jpeg, function (err, im) {
          if (!err) {
            im.convertGrayscale();
            im.gaussianBlur([5, 5], 0);
            im.detectObject(_this3.classifier, {}, function (err, result) {
              if (!err) {
                res.send(result);
              } else {
                res.status(500).send(err.message);
              }
            });
          } else {
            res.status(500).send(err.message);
          }
        });
      });
    }
  }]);

  return OpenCVAnalyzer;
}(_restServer2.default);

exports.default = OpenCVAnalyzer;