#!/usr/bin/env bash

cd test/functional/fixtures/${fixture}
npm run relay start -- --hostName=${service_host_name} --path=../../../../${domapic_path} --port=${service_port} ${service_extra_options}
npm run relay logs
