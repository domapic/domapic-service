#!/usr/bin/env bash

if ! [ -d ${domapic_path}/db ]; then
  mkdir ${domapic_path}/db
fi
mongod --version
mongod --dbpath=${domapic_path}/db --bind_ip_all
