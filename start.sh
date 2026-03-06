#!/bin/bash
pip install wisp-python --break-system-packages
python3 -m wisp.server --host 0.0.0.0 --port 10000 --static public --proxy socks5://tlaqdnkf-rotate:7gehk0l6v9li@p.webshare.io:80
