FROM node:current-alpine3.17 AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY . .
RUN npm ci

FROM node:current-alpine3.17 AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
# remove all dev modules
RUN npm run build && rm -R ./node_modules && npm install --production

FROM node:current-alpine3.17

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

# generic keys
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD [ "node", "--no-experimental-fetch", "./dist/server.js" ]
