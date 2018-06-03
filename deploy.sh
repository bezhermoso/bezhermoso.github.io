#!/bin/bash

BUILD_CMD=${BUILD_CMD:-yarn run gulp build}
$BUILD_CMD \
  && git subtree push --prefix=dist origin master
