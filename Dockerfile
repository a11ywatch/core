FROM pseudomuto/protoc-gen-doc AS generator

WORKDIR /usr/src/app

RUN apk add npm

RUN npm i @a11ywatch/protos

RUN mkdir ./doc && cp -R node_modules/@a11ywatch/protos proto

RUN protoc --doc_out=./doc --doc_opt=html,index.html proto/*.proto

FROM node:18.8.0-alpine AS installer

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl python3 make g++ && \
	rm -rf /var/cache/apk/*

COPY . .
RUN npm ci

FROM node:18.8.0-alpine AS builder

WORKDIR /usr/src/app

COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
RUN npm run build
# remove all dev modules
RUN rm -R ./node_modules
RUN npm install --production

FROM node:18.8.0-alpine

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

# generic keys
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=generator /usr/src/app/doc ./public/protodoc

ENV GRPC_HOST_PAGEMIND=pagemind:50052

CMD [ "node", "--no-experimental-fetch", "./dist/server.js" ]
