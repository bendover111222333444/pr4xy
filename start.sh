#!/usr/bin/env bash
./wgcf register           # if you need to register or update profile
./wgcf generate
./wireproxy -c wgcf-profile.conf &
npm start
