<a name="ImageAnalyzer"></a>

## ImageAnalyzer
**Kind**: global class  

* [ImageAnalyzer](#ImageAnalyzer)
    * [new ImageAnalyzer()](#new_ImageAnalyzer_new)
    * [.start(port, generator_url, publisher_url, interval)](#ImageAnalyzer+start)
    * [.stop()](#ImageAnalyzer+stop)

<a name="new_ImageAnalyzer_new"></a>

### new ImageAnalyzer()
Image Analyzer class.

It will create REST server for MediaStream Processor.
When it receives POST request which includes RGB8 format image from Processor,
it will analyze this image by anlyzer in plugins.
After that, it will response the result of analyze and POST results (JSON object
of analytic result and raw data image and box embeded image).

<a name="ImageAnalyzer+start"></a>

### imageAnalyzer.start(port, generator_url, publisher_url, interval)
start processing

**Kind**: instance method of [<code>ImageAnalyzer</code>](#ImageAnalyzer)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>number</code> | port number |
| generator_url | <code>string</code> | url of image generator |
| publisher_url | <code>string</code> | url of image publisher |
| interval | <code>number</code> | interval for retrieving image_processor_url in mili-seconds |

**Example**  
```js
const analyzer = new ImageAnalyzer()
const plugins = [
  { name: 'facedetection', url: 'http://localhost:10001/detect' }
  { name: 'bodydetection', url: 'http://localhost:10002/detect' }
]
const generator_url = 'http://localhost:7000/image/current'
const publisher_url = 'http://localhost:7001/'
const interval = 1000 // 1 sec

analyzer.start( plugins, generator_url, publisher_url, interval )
  .then(() => console.log('start'))

// after that, this will get jpeg image from generator_url every 1sec.
// then, analyze it via pulgin servers.
// then, it will publish json object data shown below.

{
  "base64img": <BASE64_ENCODED_IMG_DATA>,
  "detected" : {
    "facedetection": Array<Object>,
    "bodydetection": Array<Object>
  }
}
```
<a name="ImageAnalyzer+stop"></a>

### imageAnalyzer.stop()
stop analyzer

**Kind**: instance method of [<code>ImageAnalyzer</code>](#ImageAnalyzer)  
