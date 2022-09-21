FROM node:lts-alpine AS webapp-builder

RUN apk add openjdk8-jre

WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=webapp-builder /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
COPY environment.js.template /etc/terra-ui/environment.js.template
EXPOSE 80

CMD /bin/sh -c "envsubst < /etc/terra-ui/environment.js.template > /etc/terra-ui/environment.js && nginx -g 'daemon off;'"
