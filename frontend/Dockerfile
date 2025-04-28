# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN mkdir -p public && \
    cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js && \
    npm run build

# Production stage
FROM nginx:alpine

# Create temp directories for nginx
RUN mkdir -p /tmp/nginx/{client-body,proxy,fastcgi,uwsgi,scgi} && \
    chown -R nginx:nginx /tmp/nginx && \
    chmod -R 755 /tmp/nginx

# Copy built assets and configuration
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /etc/nginx/conf.d && \
    chmod -R 755 /usr/share/nginx/html

# Configure nginx for non-root execution
RUN printf 'pid /tmp/nginx.pid;\n\
    error_log /tmp/error.log warn;\n\
    events {\n\
    worker_connections 1024;\n\
    }\n\
    http {\n\
    client_body_temp_path /tmp/nginx/client-body;\n\
    proxy_temp_path /tmp/nginx/proxy;\n\
    fastcgi_temp_path /tmp/nginx/fastcgi;\n\
    uwsgi_temp_path /tmp/nginx/uwsgi;\n\
    scgi_temp_path /tmp/nginx/scgi;\n\
    include /etc/nginx/mime.types;\n\
    include /etc/nginx/conf.d/*.conf;\n\
    }\n' > /etc/nginx/nginx.conf

# Switch to non-root user
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 