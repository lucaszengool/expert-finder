#!/bin/bash

# Production deployment script

set -e

echo "Deploying Expert Finder to Production..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env.production file not found!"
    exit 1
fi

# Validate required environment variables
required_vars="OPENAI_API_KEY DB_PASSWORD REDIS_PASSWORD"
for var in $required_vars; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set!"
        exit 1
    fi
done

# Build and deploy
echo "Building containers..."
docker-compose -f docker-compose.production.yml build

echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo "Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.production.yml exec backend alembic upgrade head

# Health check
echo "Performing health check..."
curl -f http://localhost:8000/health || exit 1

echo "Deployment complete!"
echo "API: https://api.yourdomain.com"
echo "Frontend: https://yourdomain.com"
