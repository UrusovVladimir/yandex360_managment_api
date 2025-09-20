#!/bin/bash
set -e

echo "Creating directories..."
mkdir -p certbot/www certbot/conf ssl

echo "Using temporary nginx config for certificate issuance..."
# Монтируем временный конфиг
cp ./nginx/nginx-init.conf ./nginx/nginx.conf

echo "Starting nginx for certificate issuance..."
docker-compose up -d nginx

echo "Waiting for nginx to start..."
sleep 5

echo "Requesting SSL certificates..."
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email ${SSL_EMAIL} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN} \
  -d www.${DOMAIN}

echo "Copying certificates..."
docker-compose exec nginx sh -c "cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /ssl/ && cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /ssl/"

echo "Switching to production nginx config..."
# Возвращаем production конфиг
cp ./nginx/nginx-production.conf ./nginx/nginx.conf

echo "Restarting nginx with production config..."
docker-compose restart nginx

echo "SSL setup completed! 🎉"