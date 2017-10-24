# motion detector

motion detector (face detection etc.) for iFogCloud project.

## overview

This will get jpeg image from ``media-stream-processor`` via http://SOMEWHERE:7000/image/current. Then make a motion detection process using OpenCV in 10fps.

When motion is detected, the result will be published to mqtt broaker.

To be implemented::

It will poll detected image with motion detected. When it exists, system will make some detection process via OpenCV and other platforms.
Those detection result will be stored to InfluxDB, munin or AmazonS3.

## pre-required packages

* opencv

```bash
sudo apt-get -y install libopencv-dev yasm
```

## In and Out

* Input

- get jpeg image data from image generator (http://10.49.52.177:7000/image/current)

* Output (if configured)

- mqtt
- influxdb
- minio

* format

T.B.W

# scripts

"test": "jest",
"test:watch": "jest --watch",
"flow": "flow",
"flow:watch": "flow-watch",
"build": "babel src/ -d compiled/",
"prepublish": "yarn run build",
"start": "babel-watch -w src src/main.js",
"create:docs": "bin/createAPIref.sh"
