#!/usr/bin/env bash

pm2 delete controller

./test/end-to-end/commands/clean-db.sh

./test/end-to-end/commands/clean.sh
