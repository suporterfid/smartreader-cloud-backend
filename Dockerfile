# Base image
FROM node:20-bullseye

# Create app directory
WORKDIR /usr/src/app

RUN apt update && apt install -y bash

# Install pnpm globally
RUN npm install -g pnpm

# Install nodemon globally for hot reload
RUN npm install -g nodemon

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Bundle app source
COPY . .
RUN rm -rf node_modules && pnpm install

# Build
RUN pnpm run build

EXPOSE 3001

# Change this to use 'start' instead of 'start:prod'
# CMD ["pnpm", "start"]
# Start the application with nodemon for hot reloading
CMD ["nodemon", "--watch", ".", "--inspect=0.0.0.0:9229", "dist/main.js"]