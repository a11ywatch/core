FROM pseudomuto/protoc-gen-doc AS generator

WORKDIR /usr/src/app

RUN apk add npm

RUN npm i @a11ywatch/protos@0.1.6

RUN mkdir ./doc && cp -R node_modules/@a11ywatch/protos proto

RUN protoc --doc_out=./doc --doc_opt=html,index.html proto/*.proto

FROM node:18.4-alpine AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY package*.json bootstrap.sh ./
RUN ./bootstrap.sh && npm ci

FROM --platform=$BUILDPLATFORM node:18.4-alpine AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
RUN npm run build
# remove all dev modules
RUN rm -R ./node_modules
RUN npm install --production

FROM node:18.4-alpine

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

COPY --from=installer /usr/src/app/private.key .
COPY --from=installer /usr/src/app/public.key .
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=generator /usr/src/app/doc ./public/protodoc

CMD [ "node", "./dist/server.js" ]
