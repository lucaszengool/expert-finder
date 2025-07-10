#!/bin/bash

echo "Setting up Expert Finder..."

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed."
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed."
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is required but not installed."
    exit 1
fi

# Create data directories
mkdir -p data/chromadb

# Copy .env.example to .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "Please create backend/.env file with your OPENAI_API_KEY"
fi

echo "Setup complete!"
