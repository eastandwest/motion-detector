'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _imageAnalyzer = require('../image-analyzer');

var _imageAnalyzer2 = _interopRequireDefault(_imageAnalyzer);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jpg = _fs2.default.readFileSync(_path2.default.join(__dirname + "/testImages/face0.jpg"));

var TestServer = function () {
  function TestServer(port) {
    _classCallCheck(this, TestServer);

    this.port = port;
    this.app = (0, _express2.default)();

    var options = {
      limit: '1mb', // to receive image data
      type: 'application/json'
    };
    this.app.use(_bodyParser2.default.raw(options));

    this.server = null;

    // emulate generator
    this.app.get('/generator', function (req, res) {
      res.set('Content-Type', 'image/jpg').send(jpg);
    });

    // emulate analyzer
    this.app.post('/analyzer', function (req, res) {
      res.send([{ x: 10, y: 10, width: 50, height: 50 }]);
    });

    this.app.post('/analyzer/500', function (req, res) {
      res.status(500).send({ text: 'error' });
    });

    // emulate delayed analyzer
    this.app.post('/analyzer/delay/:time', function (req, res) {
      var delay = parseInt(req.params.time);
      setTimeout(function (ev) {
        res.send([{ x: 10, y: 10, width: 50, height: 50 }]);
      }, delay);
    });

    // emulate publisher
    // it will echo raw img data from base64 encoded one.
    this.app.post('/publisher', function (req, res) {
      var result = JSON.parse(req.body.toString());

      if (result.base64img && result.detected) res.send('ok');else res.status(400).send('property img or detected missing');
    });
  }

  _createClass(TestServer, [{
    key: 'start',
    value: function start() {
      var _this = this;

      return new Promise(function (resolv, reject) {
        _this.server = _this.app.listen(_this.port, function () {
          resolv();
        });
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this.server) {
        this.server.close();
        this.server = null;
      }
    }
  }]);

  return TestServer;
}();

describe('constructor test', function () {
  it('will create instance', function () {
    expect(new _imageAnalyzer2.default()).toBeInstanceOf(_imageAnalyzer2.default);
  });
});

describe('_setPlugins test', function () {
  var analyzer = void 0;

  beforeEach(function () {
    analyzer = new _imageAnalyzer2.default();
  });
  afterEach(function () {
    analyzer = null;
  });

  it('will set plugins property, when param is correct', function (done) {
    analyzer._setPlugins([{ name: "test", url: "http://somewhere/" }, { name: "test2", url: "http://somewhere2" }]).then(function (res) {
      expect(res).toBeUndefined();
      expect(analyzer.plugins).toHaveLength(2);
      done();
    });
  });

  it('will reject, when parameter is not Array', function (done) {
    analyzer._setPlugins('plugins').catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  it('will not set plugins, when parameter does not include proper object in Array', function (done) {
    analyzer._setPlugins([{ name: "t", url2: "hoge" }, "hoge", 1, { name: 0, url: "http://hoge/" }, { name: "tt", url: 123 }]).then(function () {
      expect(analyzer.plugins).toHaveLength(0);
      done();
    });
  });
});

describe('_analyze test', function () {
  var analyzer = void 0;
  var testServer = new TestServer(10020);
  beforeEach(function () {
    analyzer = new _imageAnalyzer2.default();
    testServer.start();
  });

  afterEach(function () {
    analyzer = null;
    testServer.stop();
  });

  it('will analyze jpg data for each specified plugins', function (done) {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }, { name: "analyze1", url: "http://localhost:10020/analyzer" }];

    analyzer._setPlugins(plugins).then(function () {
      analyzer._analyze({ img: jpg, score: 1, rect: {} }).then(function (result) {
        expect(result.img).toBe(jpg);
        expect(result.detected).toHaveProperty("analyze0");
        expect(result.detected).toHaveProperty("analyze1");
        done();
      });
    });
  });

  it('will return analyze data within timeout period (default 300msec)', function (done) {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }, { name: "analyze1", url: "http://localhost:10020/analyzer/delay/1500" }];
    analyzer._setPlugins(plugins).then(function () {
      analyzer._analyze({ img: jpg, score: 1, rect: {} }).then(function (result) {
        expect(result.img).toBe(jpg);
        expect(result.detected).toHaveProperty("analyze0");
        expect(result.detected).not.toHaveProperty("analyze1");
        done();
      });
    });
  });
  it('will return analyze data which include only status = 200 and json data', function (done) {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }, { name: "analyze1", url: "http://localhost:10020/analyzer/404" }, { name: "analyze2", url: "http://localhost:10020/analyzer/500" }];
    analyzer._setPlugins(plugins).then(function () {
      analyzer._analyze({ img: jpg, score: 1, rect: {} }).then(function (result) {
        expect(result.img).toBe(jpg);
        expect(result.detected).toHaveProperty("analyze0");
        expect(result.detected).not.toHaveProperty("analyze1");
        expect(result.detected).not.toHaveProperty("analyze2");
        done();
      });
    });
  });
});

describe('_sendPublisher test', function () {
  var analyzer = void 0;
  var testServer = new TestServer(10020);
  beforeEach(function () {
    analyzer = new _imageAnalyzer2.default();
    testServer.start();
  });

  afterEach(function () {
    analyzer = null;
    testServer.stop();
  });

  it('will analyze jpg data for each specified plugins', function (done) {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }];
    var publisher = 'http://localhost:10020/publisher';

    analyzer._setPlugins(plugins).then(function () {
      return analyzer._analyze({ img: jpg, score: 0, rect: null });
    }).then(function (res) {
      return analyzer._sendPublisher(publisher, res);
    }).then(function (res) {
      expect(res).toBeUndefined();
      done();
    });
  });

  it('will reject when publisher_url is not string', function (done) {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }];
    var publisher = 0;

    analyzer._setPlugins(plugins).then(function () {
      return analyzer._analyze({ img: jpg, score: 0, rect: null });
    }).then(function (res) {
      return analyzer._sendPublisher(publisher, res);
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject when publisher_url is not proper url string', function (done) {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }];
    var publisher = 'hoge';

    analyzer._setPlugins(plugins).then(function () {
      return analyzer._analyze({ img: jpg, score: 0, rect: null });
    }).then(function (res) {
      return analyzer._sendPublisher(publisher, res);
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject when result is not Response Object', function () {
    var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }];
    var publisher = 'http://localhost:10020/publisher';

    analyzer._setPlugins(plugins).then(function () {
      return analyzer._analyze({ img: jpg, score: 0, rect: null });
    }).then(function (res) {
      return analyzer._sendPublisher(publisher, {});
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
});

describe('_fetchThenAnalyzeThenPublish test', function () {
  var analyzer = void 0;
  var testServer = new TestServer(10020);
  beforeEach(function () {
    analyzer = new _imageAnalyzer2.default();
    testServer.start();
  });

  afterEach(function () {
    analyzer = null;
    testServer.stop();
  });
  var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }];
  var generator = 'http://localhost:10020/generator';
  var publisher = 'http://localhost:10020/publisher';

  it('will resolv, when urls are proper', function (done) {
    analyzer._setPlugins(plugins).then(function () {
      return analyzer._fetchThenAnalyzeThenPublish(generator, publisher);
    }).then(function (res) {
      expect(res).toBeUndefined();
      done();
    }).catch(function (err) {
      console.warn(err);
      done();
    });
  });

  it('will reject, when generator_url is not string', function (done) {
    analyzer._setPlugins(plugins).then(function () {
      return analyzer._fetchThenAnalyzeThenPublish(0, publisher);
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject, when generator_url is not proper url string', function (done) {
    analyzer._setPlugins(plugins).then(function () {
      return analyzer._fetchThenAnalyzeThenPublish("hoge", publisher);
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject, when publisher_url is not string', function (done) {
    analyzer._setPlugins(plugins).then(function () {
      return analyzer._fetchThenAnalyzeThenPublish(generator, 0);
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject, when publisher_url is not proper url string', function (done) {
    analyzer._setPlugins(plugins).then(function () {
      return analyzer._fetchThenAnalyzeThenPublish(generator, "hoge");
    }).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
});

describe('start and stop test', function () {
  var analyzer = void 0;
  var testServer = new TestServer(10020);
  beforeEach(function () {
    analyzer = new _imageAnalyzer2.default();
    testServer.start();
  });

  afterEach(function () {
    analyzer = null;
    testServer.stop();
  });
  var plugins = [{ name: "analyze0", url: "http://localhost:10020/analyzer" }];
  var generator = 'http://localhost:10020/generator';
  var publisher = 'http://localhost:10020/publisher';

  it('will start then stop', function (done) {
    analyzer.start(plugins, generator, publisher, 1000).then(function () {
      expect(analyzer.interval).toBeGreaterThanOrEqual(0);
      analyzer.stop();
      expect(analyzer.interval).toBeNull();
      done();
    }).catch(function (err) {
      return console.warn(err);
    });
  });
});