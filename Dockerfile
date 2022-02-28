FROM node:14.18.2-alpine

WORKDIR /usr/src/app

COPY package*.json bootstrap.sh ./

RUN apk upgrade --update-cache --available && \
	apk add openssl && \
	rm -rf /var/cache/apk/*

RUN ./bootstrap.sh && npm ci

COPY . .

RUN npm run build

FROM node:14.18.2-alpine

WORKDIR /usr/src/app

RUN apk upgrade --update-cache --available && \
	apk add openssl && \
	rm -rf /var/cache/apk/*

COPY package.json ./
RUN npm install --production

COPY --from=0 /usr/src/app/private.key .
COPY --from=0 /usr/src/app/public.key .

CMD [ "node", "./dist/server.js" ]
