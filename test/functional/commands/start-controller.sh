#!/usr/bin/env bash

node test/functional/controller/server.js --name=controller --hostName=${controller_host_name} --path=${domapic_path} ${controller_extra_options}
