#!/usr/bin/env bash

node test/end-to-end/fixtures/${fixture}/server.js --name=${service_name} --path=${domapic_path}
