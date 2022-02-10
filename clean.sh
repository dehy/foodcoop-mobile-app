#!/bin/bash

set -eux

echo "Removing node modules from $1 then reinstalling..."
cd $1
rm -rf node_modules
yarn install
echo "Cleaning gradle project..."
cd android
./gradlew clean
cd ..
