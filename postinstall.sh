#!/bin/sh

# Script executed as Yarn's postinstall

set -eu

echo "+ Executing Yarn's postinstall"

if [ "$(uname -s)" = "Darwin" ]; then
	echo "++ Executing pod install"
	set -x
	cd ./ios/
	pod update
	cd ../
	set +x
else
	echo "!! Not on macOS, skipping pod install"
fi
