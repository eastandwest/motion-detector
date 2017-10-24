'use strict';

var _opencvAnalyzer = require('../opencv-analyzer');

var _opencvAnalyzer2 = _interopRequireDefault(_opencvAnalyzer);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('constructor test', function () {
  it('will create instance, when classifier is proper cascade name', function () {
    expect(new _opencvAnalyzer2.default()).toBeInstanceOf(_opencvAnalyzer2.default);
  });
});

describe('startAnalyzer test', function () {
  var analyzer = void 0;

  beforeEach(function () {
    analyzer = new _opencvAnalyzer2.default();
  });

  afterEach(function () {
    analyzer.stop();
    analyzer = null;
  });

  it('will resolv, when param port = number and classifier is proper cascade name', function (done) {
    analyzer.startAnalyzer(10020, "FACE_CASCADE").then(function (res) {
      expect(res).toBeUndefined();
      done();
    }).catch(function (err) {
      return console.warn(err.massage);
    });
  });

  it('will resolv, when param port = number and classifier xml exists', function (done) {
    analyzer.startAnalyzer(10020, _path2.default.join(__dirname, "cascades/haarcascade_profileface.xml")).then(function (res) {
      expect(res).toBeUndefined();
      done();
    });
  });

  it('will reject, when param port is not number', function (done) {
    analyzer.startAnalyzer("ABC", _path2.default.join(__dirname, "cascades/haarcascade_profileface.xml")).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject, when param classifier is not string', function (done) {
    analyzer.startAnalyzer(10020, 123).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject, when param classifier is not correct cascade name', function (done) {
    analyzer.startAnalyzer(10020, _path2.default.join(__dirname, "INCORRECT_CASCADE")).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
  it('will reject, when param classifier file is not exist', function (done) {
    analyzer.startAnalyzer(10020, _path2.default.join(__dirname, "/unexist.xml")).catch(function (err) {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
});

describe("classifier REST interface test", function () {
  var faceImagePath = _path2.default.join(__dirname, "testImages/face0.jpg");
  var bodyImagePath = _path2.default.join(__dirname, "testImages/body0.jpg");

  var face = _fs2.default.readFileSync(faceImagePath);
  var body = _fs2.default.readFileSync(bodyImagePath);

  var server = void 0;

  beforeEach(function () {
    server = new _opencvAnalyzer2.default();
  });
  afterEach(function () {
    server.stop();
    server = null;
  });

  it('will detect face', function (done) {
    server.startAnalyzer(10020, "FACE_CASCADE").then(function () {
      return (0, _nodeFetch2.default)('http://localhost:10020/detect', {
        method: 'post',
        body: face,
        headers: {
          'content-type': 'image/jpg'
        }
      });
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      expect(json).toBeInstanceOf(Array);
      expect(json).toHaveLength(1);
      done();
    });
  });

  it('will detect body', function (done) {
    server.startAnalyzer(10020, "FULLBODY_CASCADE").then(function () {
      return (0, _nodeFetch2.default)('http://localhost:10020/detect', {
        method: 'post',
        body: body,
        headers: {
          'content-type': 'image/jpg'
        }
      });
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      expect(json).toBeInstanceOf(Array);
      done();
    });
  });

  it('will detect profile face by specifing cascade file', function (done) {
    server.startAnalyzer(10020, _path2.default.join(__dirname, "cascades/haarcascade_profileface.xml")).then(function () {
      return (0, _nodeFetch2.default)('http://localhost:10020/detect', {
        method: 'post',
        body: face,
        headers: {
          'content-type': 'image/jpg'
        }
      });
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      expect(json).toBeInstanceOf(Array);
      expect(json).toHaveLength(1);
      done();
    });
  });
});