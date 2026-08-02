# Multi-stage production build for Node.js Enterprise Auth Backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Final runtime image
FROM node:18-alpine

WORKDIR /app

# Copy built node_modules and application files
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start server
CMD ["node", "server.js"]
