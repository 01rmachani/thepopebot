#!/bin/bash

# Install dependencies if not already installed
if ! command -v node &> /dev/null; then
    apt update
    DEBIAN_FRONTEND=noninteractive apt install -y curl
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    DEBIAN_FRONTEND=noninteractive apt install -y nodejs git
fi

if ! command -v gh &> /dev/null; then
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    apt update
    DEBIAN_FRONTEND=noninteractive apt install -y gh
fi

if ! command -v ngrok &> /dev/null; then
    curl -fsSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list
    apt update
    DEBIAN_FRONTEND=noninteractive apt install -y ngrok
fi

if ! command -v supervisord &> /dev/null; then
    DEBIAN_FRONTEND=noninteractive apt install -y supervisor
fi

# Install npm dependencies for event_handler
cd /thepopebot/event_handler && npm install

# Configure ngrok authtoken if not already configured
if [ -n "$NGROK_AUTHTOKEN" ]; then
    ngrok config add-authtoken "$NGROK_AUTHTOKEN"
fi

# Start supervisord
exec supervisord -c /etc/supervisor/supervisord.conf
