#!/usr/bin/env bash

node test/functional/services/console/server.js --name=foo-service --hostName=${service_host_name} --path=${domapic_path} --port=${service_port} ${service_extra_options}
