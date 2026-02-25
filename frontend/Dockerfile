# Frontend — Vite build + nginx serve
# Stage 1: build
FROM node:22.17-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: serve static (upgrade Alpine pkgs to fix Trivy vulns e.g. libpng CVE-2026-25646)
FROM nginx:1.27-alpine3.19
RUN apk update && apk upgrade -a --no-cache && rm -rf /var/cache/apk/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
