'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * RestServer class.
 *
 * It will create template REST server.
 *
 * @property {object} app - express interface
 *
 * @class
 */
var RestServer = function () {
  function RestServer() {
    _classCallCheck(this, RestServer);

    // set initial setup for express
    this.app = (0, _express2.default)();

    var options = {
      limit: '1mb', // to receive image data
      type: 'image/jpg'
    };
    this.app.use(_bodyParser2.default.raw(options));
  }

  /**
   * start REST server
   *
   * @method RestServer#start
   * @param {number} port
   *
   * @example
   * const server = new RestServer()
   *
   * server.start(10020)
   *  .then(() => console.log('start rest server on port 10020'))
   *
   * @return {Promise<void>}
   */


  _createClass(RestServer, [{
    key: 'start',
    value: function start(port) {
      var _this = this;

      return new Promise(function (resolv, reject) {
        if (!port || typeof port !== 'number') {
          reject(new Error('port should be number'));
          return;
        }
        try {
          _this._setDefaultRoute();
          _this.setCustomRoute();
          _this.server = _this.app.listen(port, function () {
            return resolv();
          });
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Interface method to set custom route
     *
     * @method RestServer#setCustomRoute
     *
     * @example
     * class TestServer extends RestServer {
     *   setCustomRoute() {
     *     this.app.get('test', (req, res) => res.send('test'))
     *   }
     * }
     *
     * const testserver = new TestServer()
     * testserver.start(10020)
     * // curl http://localhost:10020 #=> 'test'
     */

  }, {
    key: 'setCustomRoute',
    value: function setCustomRoute() {}

    /**
     * stop listening
     *
     * @method RestServer#stop
     */

  }, {
    key: 'stop',
    value: function stop() {
      if (this.server) {
        this.server.close();
        this.server = null;
      }
    }

    /**
     * _set default route
     *
     * @method RestServer#_setDefaultRoute
     * @private
     */

  }, {
    key: '_setDefaultRoute',
    value: function _setDefaultRoute() {
      this.app.get('/', function (req, res) {
        res.send('It works!!');
      });
      this.app.get('/echo/:mesg', function (req, res) {
        res.send(req.params.mesg);
      });
    }
  }]);

  return RestServer;
}();

exports.default = RestServer;