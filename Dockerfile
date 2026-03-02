# --- Base Stage ---
FROM node:18-alpine AS base
# Install curl for Docker healthchecks
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./

# --- Development Stage ---
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- Build Stage ---
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# --- Production Stage ---
FROM base AS production
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy necessary files for migrations/runtime
COPY --from=builder /app/knexfile.js ./
COPY --from=builder /app/src/migrations ./src/migrations

# Run as non-root user for security
USER node

EXPOSE 3000
CMD ["npm", "start"]
