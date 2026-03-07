#!/bin/bash
python3 -m wisp.server --host 127.0.0.1 --port 5001 &
sleep 2
node src/index.js
