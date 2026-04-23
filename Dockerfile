FROM node:20-alpine

WORKDIR /app

# Install root dependencies
COPY package.json ./
RUN npm install --production

# Build frontend
COPY client/package.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copy server
COPY server/ ./server/

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/tracker.db

EXPOSE 3001

CMD ["node", "server/index.js"]
