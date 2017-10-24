'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A plugin class
 *
 * @class
 *
 * @param {string} name - name of plugin
 * @param {string} url - url of plugin
 */
var Plugin = function () {
  function Plugin(name, url) {
    _classCallCheck(this, Plugin);

    if (typeof name !== 'string') throw new Error('name MUST be string');
    if (typeof url !== 'string') throw new Error('url MUST be string');
    if (!this._checkURL(url)) throw new Error('url is not proper pattern');
    this.name = name;
    this.url = url;
  }

  _createClass(Plugin, [{
    key: '_checkURL',
    value: function _checkURL(url) {
      return !!url.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+$/);
    }
  }]);

  return Plugin;
}();

exports.default = Plugin;