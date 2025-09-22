FROM node:22.19-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

COPY .env.production .env

RUN npm run build

FROM nginx:alpine as production-stage

RUN rm -f /etc/nginx/nginx.conf && \
    rm -rf /etc/nginx/conf.d/* && \
    rm -rf /docker-entrypoint.d/

RUN echo "events {}" > /etc/nginx/nginx.conf && \
    echo "http { include /etc/nginx/conf.d/*.conf; }" >> /etc/nginx/nginx.conf

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]