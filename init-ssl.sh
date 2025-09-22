#!/bin/bash
set -e

echo "=== SSL Certificate Initialization ==="

if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create it from .env.example"
    exit 1
fi

export $(grep -v '^#' .env | grep -v '^$' | xargs)

echo "Creating directories..."
mkdir -p certbot/www certbot/conf ssl

echo "Stopping any running containers..."
docker-compose down 2>/dev/null || true

echo "Checking and freeing ports 80 and 443..."
sudo lsof -ti:80 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:443 | xargs sudo kill -9 2>/dev/null || true
sleep 2

echo "Requesting SSL certificate for domain: $DOMAIN"
echo "Email: $SSL_EMAIL"

echo "Checking domain accessibility..."
if ! nslookup "$DOMAIN" > /dev/null 2>&1; then
    echo "❌ Domain $DOMAIN is not resolvable"
    exit 1
fi

if timeout 300 docker run --rm \
  -p 80:80 \
  -p 443:443 \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$SSL_EMAIL" \
  -d "$DOMAIN" \
  --force-renewal; then

    echo "✅ SSL certificate obtained successfully!"
    
    if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ] && [ -f "./certbot/conf/live/$DOMAIN/privkey.pem" ]; then
        cp "./certbot/conf/live/$DOMAIN/fullchain.pem" "./ssl/"
        cp "./certbot/conf/live/$DOMAIN/privkey.pem" "./ssl/"
        chmod 600 ./ssl/*.pem
        echo "✅ Certificate copied to ssl directory"
    else
        echo "❌ Certificate files not found"
        exit 1
    fi
    
    echo "✅ SSL initialization completed!"
    echo "Now run: docker-compose up -d"
else
    echo "❌ Failed to obtain SSL certificate"
    exit 1
fi