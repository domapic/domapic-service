#!/usr/bin/env bash
cd test/end-to-end/fixtures/controller
rm -rf ../../../../${domapic_path}/.domapic/controller/logs
npm i
npm run domapic-controller start controller -- --hostName=${controller_host_name} --path=../../../../${domapic_path} --db=${db_uri} --save --auth=false
npm run domapic-controller logs controller
