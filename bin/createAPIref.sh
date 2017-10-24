#!/bin/sh

jsdoc2md -c jsdoc.conf.json src/image-analyzer.js > docs/image-analyzer.md
jsdoc2md -c jsdoc.conf.json src/rest-server.js > docs/rest-server.md
jsdoc2md -c jsdoc.conf.json src/opencv-analyzer.js > docs/opencv-analyzer.md
jsdoc2md -c jsdoc.conf.json src/result.js > docs/result.md
jsdoc2md -c jsdoc.conf.json src/motion-detection.js > docs/motion-detection.md

