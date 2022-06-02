# a11ywatch-core

[![Maintainability](https://api.codeclimate.com/v1/badges/e4ef08ad87b2fb9a2680/maintainability)](https://codeclimate.com/github/A11yWatch/a11ywatch-core/maintainability)

Central API for A11yWatch available in REST, GraphQl, and GRPC.

## Getting Started

To get started you can use docker or run on your local machine following the commands below. In order to run this repo effectively take a look at the docker compose file in the central command repo [compose](https://github.com/A11yWatch/a11ywatch/blob/main/docker-compose.yml).

```sh
docker-compose up
```

or

```sh
npm i
npm run dev
```

### User

The following roles are indicated below.

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

## Queue

Set the limit to number of test in parrallel per run to `CRAWL_QUEUE_LIMIT` env var - default is set to 8.

## LICENSE

check the license file in the root of the project.
