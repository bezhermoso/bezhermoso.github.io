#!/bin/bash

export WEBPACK_MODE=production

npm run html \
  && npm run build \
  && git add -A dist \
  && fortune -s | git commit -S -F - \
  && git subtree push --prefix=dist origin master
