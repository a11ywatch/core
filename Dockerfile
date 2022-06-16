FROM node:17.8-alpine3.14 AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY package*.json bootstrap.sh ./
RUN ./bootstrap.sh && npm ci

FROM --platform=$BUILDPLATFORM node:17.8-alpine3.14 AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
RUN npm run build
# remove all dev modules
RUN rm -R ./node_modules
RUN npm install --production

FROM node:17.8-alpine3.14

WORKDIR /usr/src/app

RUN apk add openssl curl && \
	rm -rf /var/cache/apk/*

COPY --from=installer /usr/src/app/private.key .
COPY --from=installer /usr/src/app/public.key .
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD [ "node", "./dist/server.js" ]
