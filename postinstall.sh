#!/bin/sh

# Script executed as Yarn's postinstall

set -eu

echo "+ Executing Yarn's postinstall"

if [ "$(uname -s)" = "Darwin" ]; then
	echo "++ Executing pod install"
	set -x
	pod update --project-directory=./ios/
	set +x
else
	echo "!! Not on macOS, skipping pod install"
fi
