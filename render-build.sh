#!/usr/bin/env bash
# Install Chromium
apt-get update
apt-get install -y chromium

# Set executable permissions just in case
chmod +x /usr/bin/chromium