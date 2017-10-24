<a name="Result"></a>

## Result
**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| img | <code>Buffer</code> | jpg image |
| detected | <code>Object</code> | detected result |
| num_keys | <code>Number</code> | number of keys in detected property |


* [Result](#Result)
    * [new Result(img, detected)](#new_Result_new)
    * [.base64Image()](#Result+base64Image) ⇒ <code>string</code>

<a name="new_Result_new"></a>

### new Result(img, detected)
A class of Result


| Param | Type | Description |
| --- | --- | --- |
| img | <code>Buffer</code> | jpg image |
| detected | <code>Object</code> | detected result |

<a name="Result+base64Image"></a>

### result.base64Image() ⇒ <code>string</code>
get base64image string from img property

**Kind**: instance method of [<code>Result</code>](#Result)  
**Returns**: <code>string</code> - - base64 encoded imaage  
**Example**  
```js
const res = new Result(jpeg_img, {})
res.base64Image()
// #=> <base64 encoded string>
```
