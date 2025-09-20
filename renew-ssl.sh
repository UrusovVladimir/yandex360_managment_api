#!/bin/bash
set -e

echo "Renewing SSL certificates..."
docker-compose run --rm certbot renew

echo "Copying renewed certificates..."
docker-compose exec nginx sh -c "cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /ssl/ && cp /etc/letsencrypt/live/your-domain.com/privkey.pem /ssl/"

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "SSL renewal completed!"