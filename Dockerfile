FROM node:19.8.1-alpine AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY . .
RUN npm ci

FROM node:19.8.1-alpine AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
# remove all dev modules
RUN npm run build && rm -R ./node_modules && npm install --production

FROM node:19.8.1-alpine

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

# generic keys
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD [ "node", "--no-experimental-fetch", "./dist/server.js" ]
