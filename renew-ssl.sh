#!/bin/bash
set -e

echo "Renewing SSL certificates..."
docker-compose run --rm certbot renew

echo "Copying renewed certificates..."
DOMAIN=$(grep DOMAIN .env | cut -d '=' -f2)
docker-compose exec nginx sh -c "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /ssl/"

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "SSL renewal completed!"