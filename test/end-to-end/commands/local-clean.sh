#!/usr/bin/env bash

pm2 flush
pm2 delete controller
pm2 delete relay-domapic-module

./test/end-to-end/commands/clean-db.sh

./test/end-to-end/commands/clean.sh
