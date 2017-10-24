//@flow

import express    from 'express'
import bodyParser from 'body-parser'


/**
 * RestServer class.
 *
 * It will create template REST server.
 *
 * @property {object} app - express interface
 *
 * @class
 */
export default class RestServer {
  app: Object
  server: null|Object

  constructor() {
    // set initial setup for express
    this.app = express()

    const options = {
      limit: '1mb',  // to receive image data
      type: 'image/jpg'
    }
    this.app.use(bodyParser.raw(options))
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
  start(port: number): Promise<void> {
    return new Promise((resolv, reject) => {
      if(!port || typeof(port) !== 'number') {
        reject(new Error('port should be number'))
        return
      }
      try {
        this._setDefaultRoute()
        this.setCustomRoute()
        this.server = this.app.listen(port, () => resolv())
      } catch(err) {
        reject(err)
      }
    })
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
  setCustomRoute():void {
  }

  /**
   * stop listening
   *
   * @method RestServer#stop
   */
  stop() {
    if(this.server) {
      this.server.close()
      this.server = null
    }
  }

  /**
   * _set default route
   *
   * @method RestServer#_setDefaultRoute
   * @private
   */
  _setDefaultRoute(): void {
    this.app.get('/', (req, res) => { res.send('It works!!') })
    this.app.get('/echo/:mesg', (req, res) => { res.send(req.params.mesg) })
  }
}
