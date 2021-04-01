FROM node:14.7.0-alpine

WORKDIR /usr/src/app

COPY package*.json bootstrap.sh ./

RUN apk upgrade --update-cache --available && \
	apk add openssl bash && \
	rm -rf /var/cache/apk/*

RUN bash ./bootstrap.sh && npm ci

COPY . .

RUN npm run build

CMD [ "node", "./dist/server.js" ]
