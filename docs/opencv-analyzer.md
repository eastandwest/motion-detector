<a name="OpenCVAnalyzer"></a>

## OpenCVAnalyzer
**Kind**: global class  

* [OpenCVAnalyzer](#OpenCVAnalyzer)
    * [new OpenCVAnalyzer()](#new_OpenCVAnalyzer_new)
    * [.startAnalyzer(port, classifier)](#OpenCVAnalyzer+startAnalyzer) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_OpenCVAnalyzer_new"></a>

### new OpenCVAnalyzer()
OpenCVAnalyzer

This will create REST server for jpeg analyze feature using OpenCV.

**Example**  
```js
fetch('http://localhost:10022/detect', {
  method: 'post',
  body: jpeg_data,
  'content-type': 'image/jpg'
}).then(res => res.json())
}).then(json => {
  // #=> [ { x: 141, y: 132, width: 224, height: 224 } ]
})
```
<a name="OpenCVAnalyzer+startAnalyzer"></a>

### openCVAnalyzer.startAnalyzer(port, classifier) ⇒ <code>Promise.&lt;void&gt;</code>
start analyser server

classifier should be one of
  FACE_CASCADE, EYE_CASCADE, EYEGLASSES_CASCADE, FULLBODY_CASCADE, CAR_SIDE_CASCADE
or classifier file.

**Kind**: instance method of [<code>OpenCVAnalyzer</code>](#OpenCVAnalyzer)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>number</code> | port number |
| classifier | <code>string</code> | classifier |

**Example**  
```js
const faceAnalyzer = new OpenCVAnalyzer()
faceAnalyzer.startAnalyzer(10022, "FACE_CASCADE")
  .then(() => {
    console.log("start face analyzer on port 10022")

    fetch('http://localhost:10022/detect', {
      method: 'post',
      body: jpeg_data,
      'content-type': 'image/jpg'
    }).then(res => res.json())
    }).then(json => {
      // #=> [ { x: 141, y: 132, width: 224, height: 224 } ]
    })
  })
```
