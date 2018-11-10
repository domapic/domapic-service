#!/usr/bin/env bash

node test/functional/fixtures/${fixture}/server.js --hostName=${service_host_name} --path=${domapic_path} --port=${service_port} ${service_extra_options}
