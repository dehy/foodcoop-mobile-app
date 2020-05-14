#!/bin/sh

# Script executed as Yarn's postinstall

set -eu

echo "+ Executing Yarn's postinstall"

echo "++ Executing patch-package"
patch-package

if [ "$(uname -s)" = "Darwin" ]; then
	echo "++ Executing pod update"
	pod update --project-directory=./ios/
else
	echo "!! Not on macOS, skipping pod update"
fi