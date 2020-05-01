#!/bin/sh

# Script executed as Yarn's postinstall

set -eu

patch-package

if [ "$(uname -s)" = "Darwin" ]; then
	pod update --project-directory=./ios/
fi