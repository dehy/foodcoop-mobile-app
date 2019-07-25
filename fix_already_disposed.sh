#!/bin/bash

# https://stackoverflow.com/questions/27541838/android-studio-gradle-already-disposed-module

set -u

ROOTDIR=$(dirname $0)
cd $ROOTDIR
find . -name *.iml -delete && rm .idea/modules.xml
