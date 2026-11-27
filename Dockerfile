FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose the port the server runs on (default 5000)
EXPOSE 5000

# Run as a non‑root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["npm", "run", "start"]
