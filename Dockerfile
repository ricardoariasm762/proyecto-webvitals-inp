# Multi-stage Dockerfile for Angular Standalone Frontend
FROM node:22-alpine AS build
WORKDIR /app

# Dependency descriptors copy
COPY package*.json ./
RUN npm ci

# Source code copy and production build
COPY . .
RUN npm run build

# Stage 2: Lightweight Nginx web server for production
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
