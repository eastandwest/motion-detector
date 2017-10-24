'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _restServer = require('../rest-server');

var _restServer2 = _interopRequireDefault(_restServer);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

describe('constructor', function () {
  it('will create RestServer', function () {
    expect(new _restServer2.default()).toBeInstanceOf(_restServer2.default);
  });
});

describe('start', function () {
  var server = void 0;
  beforeEach(function () {
    server = new _restServer2.default();
  });
  afterEach(function () {
    server.stop();
    server = null;
  });

  it('will start REST server when port is number', function (done) {
    server.start(10020).then(function () {
      (0, _nodeFetch2.default)('http://localhost:10020').then(function (res) {
        return res.text();
      }).then(function (text) {
        expect(text).toBe('It works!!');
        done();
      });
    });
  });

  it('will raise error when port is blank', function (done) {
    return server.start().catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will raise error when port is not number', function (done) {
    return server.start('10020').catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
});

describe('setCustomRoute', function () {
  var TestServer = function (_RestServer) {
    _inherits(TestServer, _RestServer);

    function TestServer() {
      _classCallCheck(this, TestServer);

      return _possibleConstructorReturn(this, (TestServer.__proto__ || Object.getPrototypeOf(TestServer)).call(this));
    }

    _createClass(TestServer, [{
      key: 'setCustomRoute',
      value: function setCustomRoute() {
        this.app.get('/test', function (req, res) {
          res.send('test');
        });
      }
    }]);

    return TestServer;
  }(_restServer2.default);

  var testserver = void 0;
  beforeEach(function () {
    testserver = new TestServer();
  });
  afterEach(function () {
    testserver.stop();
    testserver = null;
  });

  it('will create custom route', function (done) {

    testserver.start(10020).then(function () {
      return (0, _nodeFetch2.default)('http://localhost:10020/test');
    }).then(function (res) {
      return res.text();
    }).then(function (text) {
      expect(text).toBe('test');
      done();
    });
  });
});