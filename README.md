# hiring-system

This application is generated using [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) with the
[initial project layout](https://loopback.io/doc/en/lb4/Loopback-application-layout.html).

## Install dependencies

By default, dependencies were installed when this application was generated.
Whenever dependencies in `package.json` are changed, run the following command:

```sh
npm install
```

To only install resolved dependencies in `package-lock.json`:

```sh
npm ci
```

## Environment variables

There is a `.env.example` file on the root folder that should be used to create
your own `.env` file that will be used by this application.

## Run the application

```sh
npm start
```

You can also run `node .` to skip the build step.

Open http://127.0.0.1:3000 in your browser.

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```

## Fix code style and formatting issues

```sh
npm run lint
```

To automatically fix such issues:

```sh
npm run lint:fix
```

## Other useful commands

- `npm run migrate`: Migrate database schemas for models
- `npm run openapi-spec`: Generate OpenAPI spec into a file
- `npm run docker:build`: Build a Docker image for this application
- `npm run docker:run`: Run this application inside a Docker container

### Migrate options

We have a couple options to manage the database schema migrations. These options
should be included by the end of the `npm` command, for example:

```
npm run migrate -- --populate
```

Here are the available options:

- `--populate`: Will seed the database with initial data. Please note that this
  does not include dummmy data, only real data to be used within the models,
  such as Sector and Administration.
- `--dummy`: This will populate the database with example data to assist the
  development. The dummy data can be seen at `src/seeds/*.dummy.json`.
- `--rebuild`: This will drop all tables and will create new tables from
  scratch. **This will delete all data**, use with caution.

### Service options

This application is ready to be used as an service through [PM2](https://pm2.keymetrics.io/)
process manager. The configurations used are at the `ecosystem.config.js` file.

- `npm run service:start`: Start the application.
- `npm run service:restart`: Restart the currently running application.
- `npm run service:reload`: Reload the currently running application configs from PM2.
- `npm run service:stop`: Stop the running application.
- `npm run service:status`: Display the current status of the running instances.

**Please note** that the service will use the currently built version of the
application, so in order to have the latest changes running, you must run
`npm run build` first.

## Tests

```sh
npm test
```

## What's next

Please check out [LoopBack 4 documentation](https://loopback.io/doc/en/lb4/) to
understand how you can continue to add features to this application.

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)
