'use strict';

var _result = require('../result');

var _result2 = _interopRequireDefault(_result);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('constructor test', function () {
  it('will create instance, when parameters are collect', function () {
    expect(new _result2.default(new Buffer(0), {})).toBeInstanceOf(_result2.default);
  });

  it('will raise error, when img param is not Buffer object', function () {
    expect(function () {
      new _result2.default({}, {});
    }).toThrow();
  });
  it('will raise error, when detected param is not object', function () {
    expect(function () {
      new _result2.default(new Buffer(0), 1);
    }).toThrow();
  });
});

describe('base64Image test', function () {
  var res = void 0;
  beforeEach(function () {
    res = new _result2.default(new Buffer([0, 1, 2]), {});
  });
  afterEach(function () {
    res = null;
  });

  it('will create base64 encoded string', function () {
    expect(res.base64Image()).toBe('AAEC');
  });
});

describe('num_keys test', function () {
  it('will return 1, when detected = {"a": 1}', function () {
    var res = new _result2.default(new Buffer(1), { "a": 1 });
    expect(res.num_keys).toBe(1);
  });

  it('will return 0, when detected = {}', function () {
    var res = new _result2.default(new Buffer(1), {});
    expect(res.num_keys).toBe(0);
  });

  it('will return 0, when detected = {md_score:0, md_rect: null}', function () {
    var res = new _result2.default(new Buffer(1), { md_score: 0, md_rect: null });
    expect(res.num_keys).toBe(0);
  });

  it('will return 1, when detected = {md_score:0, md_rect: null, a: 1}', function () {
    var res = new _result2.default(new Buffer(1), { md_score: 0, md_rect: null, a: 1 });
    expect(res.num_keys).toBe(1);
  });

  it('will return 3, when detected = {md_score:1, md_rect: {}, a: 1}', function () {
    var res = new _result2.default(new Buffer(1), { md_score: 0, md_rect: null, a: 1 });
    expect(res.num_keys).toBe(1);
  });
});