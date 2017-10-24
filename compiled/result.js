'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A class of Result
 *
 * @class
 *
 * @property {Buffer} img - jpg image
 * @property {Object} detected - detected result
 * @property {Number} num_keys - number of keys in detected property
 *
 * @param {Buffer} img - jpg image
 * @param {Object} detected - detected result
 */
var Result = function () {
  function Result(img, detected) {
    _classCallCheck(this, Result);

    if (!(img instanceof Buffer)) throw new Error('img should be Buffer object');
    if ((typeof detected === 'undefined' ? 'undefined' : _typeof(detected)) !== 'object') throw new Error('detected should be object');
    this.img = img;
    this.detected = detected;
  }

  _createClass(Result, [{
    key: 'base64Image',


    /**
     * get base64image string from img property
     *
     * @example
     * const res = new Result(jpeg_img, {})
     * res.base64Image()
     * // #=> <base64 encoded string>
     *
     * @method Result#base64Image
     *
     * @returns {string} - base64 encoded imaage
     */
    value: function base64Image() {
      return this.img.toString('base64');
    }
  }, {
    key: 'num_keys',
    get: function get() {
      // when md_score === 0, we'll decrease 2 from num for md_score and md_rect.
      var num = 0;

      for (var key in this.detected) {
        if (this.detected.hasOwnProperty(key)) num++;
      }if (this.detected.md_score === 0) num -= 2;

      return num;
    }
  }]);

  return Result;
}();

exports.default = Result;