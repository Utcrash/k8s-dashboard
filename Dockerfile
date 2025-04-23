FROM node:20 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Set default environment variable
ENV K8S_API_URL=http://localhost:8001

# Default expose port 80
EXPOSE 80

# Use a script to replace environment variables and start nginx
COPY <<EOF /docker-entrypoint.d/40-envsubst-on-nginx-conf.sh
#!/bin/sh
set -e
envsubst '\$K8S_API_URL' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf
EOF

RUN chmod +x /docker-entrypoint.d/40-envsubst-on-nginx-conf.sh

CMD ["nginx", "-g", "daemon off;"] 