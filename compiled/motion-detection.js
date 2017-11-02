'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _opencv = require('opencv');

var _opencv2 = _interopRequireDefault(_opencv);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeKmeans = require('node-kmeans');

var _nodeKmeans2 = _interopRequireDefault(_nodeKmeans);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var app = (0, _express2.default)();

/**
 * Motion Detection class.
 *
 * This class will compare previous image, then compare each pixel after gray and gaussian processing.
 * After that, it will be applied threshold processing, then calcurate score by obtaining average of each pixel value.
 *
 * @class
 *
 * @property {?Buffer} prev - previous image
 * @property {number} port - port number of test web server, currently hard coded with 20000
 * @property {object} app   - express object for test web server
 * @property {string} imgDir - the directory which will store intermidiate image for debugging
 *
 * @example
 *
 * const md = new MotionDetection()
 * md.detect(jpg0).then( obj => {
 *   // #=> {jpg: jpg0, score: 0, contours: null}
 * )
 *
 * md.detect(jpg1).then(obj => {
 *   // #=> {jpg: jpg1, score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...] }
 *   // when score is zero which means not motion detected, contours will be null
 * })
 */

var MotionDetection = function () {
  function MotionDetection() {
    _classCallCheck(this, MotionDetection);

    this.prev = null;
    this.port = 20000;
    this.app = (0, _express2.default)();
    this.imgDir = _path2.default.join(__dirname, "../images");
  }

  /**
   * do motion detection
   *
   * @params {Buffer} jpg - jpg image
   * @method MotionDetection#detect
   * @returns {Promise<{img: Buffer, score: number, contours: Array<{x: number, y: number, width: number, height:number>|null}>, box: {x: number, y: number, width: number, height: number}>}
   *
   * @examples
   * md.detect(jpg).then(obj => {
   *   // #=> {jpg: [jpg data], score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...], box: {x: 10, y: 10, width: 20, height: 120} }
   * })
   */


  _createClass(MotionDetection, [{
    key: 'detect',
    value: function detect(jpg) {
      var _this = this;

      return new Promise(function (resolv, reject) {
        _opencv2.default.readImage(jpg, function (err, mat) {
          if (err) {
            reject(err);
          } else {
            var _score = 0,
                _contours = [],
                box = {},
                clusters = [];

            // pre-processing
            // grayscale then blur to eliminate noise
            mat.convertGrayscale();
            mat.gaussianBlur([11, 11], 0);

            if (_this.prev) {
              // create differetiation image
              var diff = mat.copy();
              diff.absDiff(_this.prev, mat);
              var th = diff.threshold(25, 255, "Binary");
              // th.save(this.imgDir+"/diff.jpg")  please comment out while debugging

              _score = _this._calcScore(th);
              _contours = _this._getContoursBoundaries(th);
              clusters = _this._getContoursClusters(_contours);
              box = _this._calcBox(_contours);
            }
            _this.prev = mat;

            resolv({ img: jpg, score: _score, contours: _contours, box: box });
          }
        });
      });
    }

    /**
     * get contours clousters
     *
     * @params {Array<object>} contours - array of contour object
     * @return {Object} - contours cluster object
     */

  }, {
    key: '_getContoursClusters',
    value: function _getContoursClusters(contours) {
      console.log(contours);
    }

    /**
     * calucrate motion detection box
     * @private
     */

  }, {
    key: '_calcBox',
    value: function _calcBox(contours) {
      var x0 = -1,
          y0 = -1,
          x1 = -1,
          y1 = -1;

      contours.forEach(function (c) {
        x0 = x0 === -1 || c.x < x0 ? c.x : x0;
        y0 = y0 === -1 || c.y < y0 ? c.y : y0;
        x1 = x1 === -1 || x1 < c.x + c.width ? c.x + c.width : x1;
        y1 = y1 === -1 || y1 < c.y + c.height ? c.y + c.height : y1;
      });

      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }

    /**
     * calcurate motion detection score
     *
     * score is simply calcurated by average of each pixel
     *
     * @params {Object} mat - Matrix object
     * @method MotionDetection#_calcScore
     * @returns {number} - score
     * @private
     */

  }, {
    key: '_calcScore',
    value: function _calcScore(mat) {
      var buff = mat.getData();

      var score = 0;
      for (var i = 0, l = buff.length; i < l; i++) {
        score += buff.readUInt8(i);
      }
      score /= buff.length;

      return score;
    }

    /**
     * get countours boundaries
     *
     * @param {Object} mat - Matrix object (we'll assume threshold processed)
     * @method MotionDetection#_getContoursBoundaries
     * @return {Array<{x, y, width, height}>}
     * @private
     */

  }, {
    key: '_getContoursBoundaries',
    value: function _getContoursBoundaries(mat) {
      var ret = [];

      var cont = mat.copy().findContours();
      for (var i = 0, l = cont.size(); i < l; i++) {
        ret.push(cont.boundingRect(i));
      }
      return ret;
    }

    /**
     * get active boundary
     *
     * currently, this method is not used. but, for future use, we'll reamin it.
     *
     * @params {Object} mat - Matrix object (we'll assume threshold processed)
     * @method MotionDetection#_getActiveBoundary
     * @return {Object|Null} - ret {x, y, width, height}
     * @private
     */

  }, {
    key: '_getActiveBoundary',
    value: function _getActiveBoundary(mat) {
      var cont = mat.copy().findContours();

      var _r = { x0: 640, y0: 480, x1: 0, y1: 0 };
      var _l = cont.size();

      for (var i = 0; i < _l; i++) {
        var b = cont.boundingRect(i);
        var x0 = b.x,
            y0 = b.y,
            x1 = b.x + b.width,
            y1 = b.y + b.height;

        _r.x0 = _r.x0 < x0 ? _r.x0 : x0;
        _r.x1 = _r.x1 > x1 ? _r.x1 : x1;
        _r.y0 = _r.y0 < y0 ? _r.y0 : y0;
        _r.y1 = _r.y1 > y1 ? _r.y1 : y1;
      }

      return _l > 0 ? { x: _r.x0, y: _r.y0, width: _r.x1 - _r.x0, height: _r.y1 - _r.y0 } : null;
    }

    /**
     * test web server for debugging
     *
     * @params {number} port
     * @private
     */

  }, {
    key: '_startTestServer',
    value: function _startTestServer(port) {
      var _this2 = this;

      this.app.get('/', function (req, res) {
        return res.send('It works!!');
      });
      this.app.get('/:img', function (req, res) {
        res.set('Content-Type', 'image/jpeg').send(_fs2.default.readFileSync(_this2.imgDir + "/" + req.params.img + ".jpg"));
      });

      this.app.listen(port, function () {
        console.log("test server started :", port);
      });
    }
  }]);

  return MotionDetection;
}();

exports.default = MotionDetection;