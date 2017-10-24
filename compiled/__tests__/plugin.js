'use strict';

var _plugin = require('../plugin');

var _plugin2 = _interopRequireDefault(_plugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('constructor test', function () {
  it('will create instance when parameters are collect', function () {
    expect(new _plugin2.default('facedetection', 'http://localhost:10002/face')).toBeInstanceOf(_plugin2.default);
  });

  it('will raise error when name is not string', function () {
    expect(function () {
      return new _plugin2.default(0, 'http://localhost:10002/face');
    }).toThrow();
  });

  it('will raise error when url is not string', function () {
    expect(function () {
      return new _plugin2.default('facedetection', 0);
    }).toThrow();
  });

  it('will raise error when url does not match url pattern ', function () {
    expect(function () {
      return new _plugin2.default('facedetection', 'hoge');
    }).toThrow();
  });
});