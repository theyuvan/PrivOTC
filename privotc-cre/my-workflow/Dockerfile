# Dockerfile for CRE Matching Service on Railway
FROM node:20-alpine

# Install CRE CLI
RUN npm install -g @chainlink/cre-cli@latest

# Create app directory
WORKDIR /app

# Copy workflow files
COPY . .

# Install dependencies
RUN npm install

# Copy environment variables
COPY .env .env

# Run matching every 30 seconds
CMD while true; do \
      echo "🔄 Running CRE matching..."; \
      cre workflow simulate . --project-root . --target privotc-staging --trigger-index 2 --non-interactive; \
      sleep 30; \
    done
