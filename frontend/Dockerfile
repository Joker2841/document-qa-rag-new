# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install 'gettext' which provides the 'envsubst' utility for variable substitution
RUN apk add --no-cache gettext

# Copy custom nginx config as a template that can be modified on startup
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# This is the key change:
# On container start, use 'envsubst' to replace variables in the template,
# create the final nginx.conf, and then start the Nginx server.
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]