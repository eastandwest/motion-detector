//@flow

/**
 * A plugin class
 *
 * @class
 *
 * @param {string} name - name of plugin
 * @param {string} url - url of plugin
 */
class Plugin {
  name: string
  url: string

  constructor(name: string, url: string) {
    if(typeof(name) !== 'string') throw new Error('name MUST be string')
    if(typeof(url) !== 'string') throw new Error('url MUST be string')
    if(!this._checkURL(url)) throw new Error('url is not proper pattern')
    this.name = name
    this.url = url
  }

  _checkURL(url: string): boolean {
    return !!url.match(/^https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+$/)
  }
}

export default Plugin
