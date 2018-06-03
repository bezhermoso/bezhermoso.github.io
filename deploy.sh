#!/bin/bash

if [ ! -e dist ]; then
  git clone $(git remote get-url origin) dist --branch master
fi

if [ ! -d dist ]; then
  echo "dist/ directory must be a directory. To correct, remove it and run this script again."
  exit 1
fi

if [ ! $(git -C dist rev-parse --show-toplevel) = $(realpath dist) ]; then
  echo "dist/ directory must be a Git repository of its own. To correct, remove it and run this script again."
  exit 1
fi


GULP_COMMAND=${GULP_COMMAND:-yarn run gulp}
$GULP_COMMAND build && cd dist && git add * && git commit -S && git push origin master -f
