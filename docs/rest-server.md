<a name="RestServer"></a>

## RestServer
**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| app | <code>object</code> | express interface |


* [RestServer](#RestServer)
    * [new RestServer()](#new_RestServer_new)
    * [.start(port)](#RestServer+start) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.setCustomRoute()](#RestServer+setCustomRoute)
    * [.stop()](#RestServer+stop)

<a name="new_RestServer_new"></a>

### new RestServer()
RestServer class.

It will create template REST server.

<a name="RestServer+start"></a>

### restServer.start(port) ⇒ <code>Promise.&lt;void&gt;</code>
start REST server

**Kind**: instance method of [<code>RestServer</code>](#RestServer)  

| Param | Type |
| --- | --- |
| port | <code>number</code> | 

**Example**  
```js
const server = new RestServer()

server.start(10020)
 .then(() => console.log('start rest server on port 10020'))
```
<a name="RestServer+setCustomRoute"></a>

### restServer.setCustomRoute()
Interface method to set custom route

**Kind**: instance method of [<code>RestServer</code>](#RestServer)  
**Example**  
```js
class TestServer extends RestServer {
  setCustomRoute() {
    this.app.get('test', (req, res) => res.send('test'))
  }
}

const testserver = new TestServer()
testserver.start(10020)
// curl http://localhost:10020 #=> 'test'
```
<a name="RestServer+stop"></a>

### restServer.stop()
stop listening

**Kind**: instance method of [<code>RestServer</code>](#RestServer)  
