FROM node:21.6-alpine3.19 AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY . .
RUN npm ci

FROM node:21.6-alpine3.19 AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
# remove all dev modules
RUN npm run build && rm -R ./node_modules && npm install --production

FROM node:21.6-alpine3.19

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

# generic keys
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD [ "node", "--no-experimental-fetch", "./dist/server.js" ]
