#!/bin/bash

./wireproxy -c wgcf-profile.conf &

export HTTP_PROXY="http://127.0.0.1:40000"
export HTTPS_PROXY="http://127.0.0.1:40000"

npm start
