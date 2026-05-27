FROM node:22-alpine as build
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_ORIGIN=http://localhost/api
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
RUN npm run build
