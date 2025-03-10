# Base image
FROM node:20-bullseye

# Create app directory
WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Install nodemon globally for hot reload
RUN npm install -g nodemon

# Copy package files first
COPY package*.json ./

# Install dependencies without bcrypt
RUN pnpm install --ignore-scripts

# Copy all source files
COPY . .

# Install and build bcrypt specifically
RUN npm install bcrypt@5.1.1 --build-from-source

# Build the application
RUN pnpm run build

EXPOSE 3001

# Start the application with nodemon for hot reloading
CMD ["nodemon", "--watch", ".", "--inspect=0.0.0.0:9229", "dist/main.js"]
