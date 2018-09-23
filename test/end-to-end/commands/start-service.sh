#!/usr/bin/env bash

node test/end-to-end/fixtures/${fixture}/server.js --name=${fixture} --hostName=${service_host_name} --port=${service_port} --path=${domapic_path}
