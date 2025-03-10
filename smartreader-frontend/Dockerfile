# Stage 1: Build the React app using pnpm
FROM node:20-alpine as build
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if present) for dependency installation
COPY package*.json ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application source code and build the app
COPY . .
RUN pnpm run build

# Stage 2: Serve the React app with nginx
FROM nginx:alpine

# Remove default nginx static assets (optional)
RUN rm -rf /usr/share/nginx/html/*

# Copy the built React app from the previous stage into nginx's public folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
