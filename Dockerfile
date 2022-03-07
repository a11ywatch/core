FROM node:14.18.2-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json bootstrap.sh ./

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

RUN ./bootstrap.sh && npm ci

COPY . .

RUN npm run build

FROM node:14.18.2-alpine AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY package*.json ./
RUN npm install --production

FROM node:14.18.2-alpine

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl && \
	rm -rf /var/cache/apk/*

COPY --from=builder /usr/src/app/private.key .
COPY --from=builder /usr/src/app/public.key .
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=installer /usr/src/app/node_modules ./node_modules

CMD [ "node", "./dist/server.js" ]
