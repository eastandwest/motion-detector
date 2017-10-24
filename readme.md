# image analyzer

image analyzer (face detection etc.) for iFogCloud project.

## opencv

```bash
sudo apt-get -y install libopencv-dev yasm
```

## default analyze servers (opencv)

* facedetection
  - port : 10000
  - url  : http://localhost:10000/detect
* bodydetection
  - port : 10001
  - url  : http://localhost:10001/detect

## In and Out

* Input

- get jpeg image data from image generator (http://10.49.52.177:7000/image/current)

* Output

- POST detected data as json format in body with base64 image to publisher
  - publisher_url: http://localhost:7001/

- Format

```
@property {string} base64img
@property {Object} detected
```

example

```
{
  base64img: <BASE64_ENCODED_IMAGE>,
  detected: {
    bodydetection: [{"x":316,"y":243,"width":43,"height":85}],
    facedetection: [{"x":135,"y":246,"width":200,"height":200}]
  }
}
```

