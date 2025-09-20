FROM node:22.19-alpine as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
COPY .env.production .env

RUN npm run build

FROM nginx:alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -g 1001 -S nginxgroup && \
    adduser -S nginxuser -u 1001 -G nginxgroup

RUN chown -R nginxuser:nginxgroup /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

USER nginxuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]