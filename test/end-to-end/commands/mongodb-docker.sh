#!/usr/bin/env bash

if ! [ -d db ]; then
  mkdir db
fi
mongod --version
mongod --dbpath=db --bind_ip_all
