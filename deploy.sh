#!/bin/bash

gulp build && cd dist && git add * && git commit -S && git push origin master -f
