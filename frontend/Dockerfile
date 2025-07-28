# Enhanced Frontend Dockerfile for AI Outreach Platform
FROM node:18-alpine as build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --silent

# Copy source code
COPY . .

# Set build arguments for Railway
ARG REACT_APP_API_URL
ARG REACT_APP_CLERK_PUBLISHABLE_KEY
ARG REACT_APP_ENVIRONMENT=production

# Set environment variables
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_CLERK_PUBLISHABLE_KEY=${REACT_APP_CLERK_PUBLISHABLE_KEY}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}
ENV GENERATE_SOURCEMAP=false

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port (Railway will map this automatically)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
