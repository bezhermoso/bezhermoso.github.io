#!/usr/bin/env bash

BUILD_CMD=${BUILD_CMD:-./node_modules/.bin/gulp build}
$BUILD_CMD \
  && git add -A dist \
  && fortune -s | git commit -m - \
  && git subtree push --prefix=dist origin master
