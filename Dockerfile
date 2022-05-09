FROM --platform=$BUILDPLATFORM node:17.8-alpine3.14 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

RUN npm ci

COPY . .

RUN npm run build

FROM node:17.8-alpine3.14 AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY package*.json ./
RUN npm install --production

FROM node:17.8-alpine3.14

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=installer /usr/src/app/node_modules ./node_modules

CMD [ "node", "./dist/server.js" ]
