#!/usr/bin/env bash

cd test/end-to-end/fixtures/${fixture}
npm i
./node_modules/.bin/pm2 flush
npm run domapic-controller start controller -- --hostName=${controller_host_name} --path=../../../../${domapic_path} --db=${db_uri} --save --authDisabled
npm run domapic-controller logs controller
