# a11ywatch-core

[![Maintainability](https://api.codeclimate.com/v1/badges/e4ef08ad87b2fb9a2680/maintainability)](https://codeclimate.com/github/A11yWatch/a11ywatch-core/maintainability)

central api for a11ywatch

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

```
free: role = 0
basic: role = 1
premium: role = 2
entreprise: role = 3
```

### Model Setup

1. In the model folder the methods have the first param as direct props descendant and the second is the params from the query.

### Emailing

To get the emailer working add your `private.key` and `public.key` to the root of the project through ssh or another method.

## Release

In order to send a production build using a docker image make sure to add your servers private and pubic keys at the root of the sub directory before building.

## LICENSE

check the license file in the root of the project.
