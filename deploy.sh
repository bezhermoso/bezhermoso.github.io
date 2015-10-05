#!/bin/bash

grunt build
cd dist && git add * && git commit && git push origin master
