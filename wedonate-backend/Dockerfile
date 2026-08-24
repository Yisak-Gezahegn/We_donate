FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Generate prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build TypeScript code
RUN npm run build

# Production Image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Ensure uploads directory exists and is writable by node user
RUN mkdir -p uploads && chown -R node:node uploads

# Run as non-root user
USER node

EXPOSE 3000

# Entry point starts the application
CMD ["npm", "start"]
