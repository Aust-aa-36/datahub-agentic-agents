# Use Node.js 20
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Install dev dependencies to build (tsc)
RUN npm install --save-dev typescript @types/node

# Build TypeScript to JavaScript
RUN npx tsc

# Environment defaults
ENV PORT=3400

# Expose port
EXPOSE 3400

# Start the server
CMD ["node", "dist/index.js"]
