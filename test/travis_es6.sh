#!/bin/sh

if [ "$TRAVIS_NODE_VERSION" != "0.12" ]
then
    $(npm bin)/mocha --harmony test/es6_test.es6
fi
