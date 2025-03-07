# Use official Node.js image
FROM node:18

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy app.js
COPY app.js .

# Set environment variable for Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
