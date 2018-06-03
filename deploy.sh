#!/bin/bash

GULP_COMMAND=${GULP_COMMAND:-yarn run gulp}
$GULP_COMMAND build && cd dist && git add * && git commit -S && git push origin master -f
