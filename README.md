# a11ywatch-core

[![Maintainability](https://api.codeclimate.com/v1/badges/e4ef08ad87b2fb9a2680/maintainability)](https://codeclimate.com/github/A11yWatch/a11ywatch-core/maintainability)

HTTP API for a11ywatch

## Getting Started

### Docker

1. `docker-compose up`

### Local Build

1. `npm install`
2. `npm run dev`

## Database

Below is only needed to run locally currently.

1. start mongodb locally and add the connection to the proper `DB_URL` env variable example `mongodb://127.0.0.1:27017/?compressors=zlib&gssapiServiceName=mongodb`.
2. get mongodump contents from team member and run `mongorestore`.

## Data Info

### User

roles

```
free = 0
basic = 1
premium = 2
entreprise = 3
```

### Emailing

To get the emailer working add the following env variables to the project.

```
EMAIL_SERVICE_URL=support@someemail.com
EMAIL_CLIENT_ID=
EMAIL_CLIENT_KEY=
```

## LICENSE

check the license file in the root of the project.
