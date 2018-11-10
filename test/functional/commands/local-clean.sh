#!/usr/bin/env bash

pm2 flush
pm2 delete controller
pm2 delete relay-domapic-module

./test/functional/commands/clean.sh
