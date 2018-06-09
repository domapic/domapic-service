#!/usr/bin/env bash

node test/integration/controller/server.js --name=controller --hostName=${controller_host_name} --path=${domapic_path}
