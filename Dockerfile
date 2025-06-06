FROM node:22.12.0-alpine3.20 AS build
 
WORKDIR /frontend

# Install deps first to avoid installing dependencies on every code change
COPY package.json package-lock.json ./

RUN npm ci --no-audit

COPY . .
 
RUN npm ci --no-audit && npm run build
 
FROM nginx:stable-alpine-slim

COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /frontend/dist/ /usr/share/nginx/html/

EXPOSE 80
