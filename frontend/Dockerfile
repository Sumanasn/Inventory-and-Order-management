# Stage 1: Build the React application using Node
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency configuration files first to utilize Docker layer caching
COPY package*.json ./
RUN npm install

# Copy all front-end source files and compile the static production build
COPY . .
RUN npm run build

# Stage 2: Serve the compiled static assets using a lightweight Nginx web server
FROM nginx:alpine
# Copy the compiled production build assets from Stage 1 into Nginx's public server folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 inside the container for outbound web traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
