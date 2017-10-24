<a name="MotionDetection"></a>

## MotionDetection
**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| prev | <code>Buffer</code> | previous image |
| port | <code>number</code> | port number of test web server, currently hard coded with 20000 |
| app | <code>object</code> | express object for test web server |
| imgDir | <code>string</code> | the directory which will store intermidiate image for debugging |


* [MotionDetection](#MotionDetection)
    * [new MotionDetection()](#new_MotionDetection_new)
    * [.detect()](#MotionDetection+detect) ⇒

<a name="new_MotionDetection_new"></a>

### new MotionDetection()
Motion Detection class.

This class will compare previous image, then compare each pixel after gray and gaussian processing.
After that, it will be applied threshold processing, then calcurate score by obtaining average of each pixel value.

**Example**  
```js
const md = new MotionDetection()
md.detect(jpg0).then( obj => {
  // #=> {jpg: jpg0, score: 0, contours: null}
)

md.detect(jpg1).then(obj => {
  // #=> {jpg: jpg1, score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...] }
  // when score is zero which means not motion detected, contours will be null
})
```
<a name="MotionDetection+detect"></a>

### motionDetection.detect() ⇒
do motion detection

**Kind**: instance method of [<code>MotionDetection</code>](#MotionDetection)  
**Returns**: {Promise<{img: Buffer, score: number, contours: Array<{x: number, y: number, width: number, height:number>|null}>}  
**Params**: <code>Buffer</code> jpg - jpg image  
**Examples**: md.detect(jpg).then(obj => {
  // #=> {jpg: [jpg data], score: 12.4, contours: [{x: 12, y: 15, width: 45, height: 67}, ...] }
})  
