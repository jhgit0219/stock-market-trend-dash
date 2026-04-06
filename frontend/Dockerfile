# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies separately to leverage layer cache
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our SPA + API-proxy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite production build from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx runs as PID 1 in the foreground; -g daemon off keeps it that way
CMD ["nginx", "-g", "daemon off;"]
