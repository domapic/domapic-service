#!/usr/bin/env bash

API_KEY=$(node test/end-to-end/commands/get-controller-api-key.js)

echo "CONTROLLER API KEY--------------> ${API_KEY}"

node test/end-to-end/fixtures/${fixture}/server.js --name=${service_name} --hostName=${service_host_name} --port=${service_port} --path=${domapic_path} --controller=http://${controller_host_name}:3000 --auth=false --logLevel=debug --save
