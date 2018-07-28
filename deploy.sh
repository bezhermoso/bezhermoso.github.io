#!/bin/bash

BUILD_CMD=${BUILD_CMD:-yarn run gulp build}
$BUILD_CMD \
  && git add -A dist \
  && fortune -s | git commit -S -m - \
  && git subtree push --prefix=dist origin master
