#!/bin/bash
# Проверяем, требуется обнолвение или нет (за 30 дней до истечения)

DOMAIN=$(grep DOMAIN .env | cut -d '=' -f2)
CERT_FILE="./certbot/conf/live/$DOMAIN/cert.pem"

if [ -f "$CERT_FILE" ]; then
    EXPIRY_DATE=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ "$DAYS_LEFT" -lt 30 ]; then
        echo "Certificate expires in $DAYS_LEFT days. Renewing..."
        ./ssl_renew.sh
    else
        echo "Certificate OK. $DAYS_LEFT days left."
    fi
fi