#!/usr/bin/env bash

node test/end-to-end/fixtures/${fixture}/server.js --name=${service_name} --hostName=${service_host_name} --port=${service_port} --path=${domapic_path} --logLevel=debug
