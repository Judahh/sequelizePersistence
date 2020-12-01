# sequelizePersistence

![Publish](https://github.com/Judahh/sequelizePersistence/workflows/Publish/badge.svg)
[![npm version](https://badge.fury.io/js/@flexiblepersistence/sequelize.svg)](https://badge.fury.io/js/@flexiblepersistence/sequelize)
[![npm downloads](https://img.shields.io/npm/dt/@flexiblepersistence/sequelize.svg)](https://img.shields.io/npm/dt/@flexiblepersistence/sequelize.svg)

A Service implementation for Flexible Persistence's PersistenceAdapter

```js
// Init Journaly as a observer platform for using as a message broker
const journaly = Journaly.newJournaly() as SubjectObserver<any>;

// config read database
read = new DAODB(database, {
  test: new TestDAO(),
  object: new ObjectDAO(),
});

// config write database
write = new MongoDB(
  new PersistenceInfo(
    {
      database: 'write',
      host: process.env.MONGO_HOST || 'localhost',
      port: process.env.MONGO_PORT,
    },
    journaly
  )
);

// init Flexible Persistence handler with write and read databases
const handler = new Handler(write, read);

// sample object
const obj = {};
obj['test'] = 'test';

// create an event to create an object
const persistencePromise = await handler.addEvent(
  new Event({ operation: Operation.create, name: 'object', content: obj })
);

// prints create event
console.log(persistencePromise);
```

![Overview](./doc/overview.svg)

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing,
[download and install Node.js](https://nodejs.org/en/download/).

If this is a brand new project, make sure to create a `package.json` first with
the [`npm init` command](https://docs.npmjs.com/creating-a-package-json-file) or
[`yarn init` command](https://classic.yarnpkg.com/en/docs/cli/init/).

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally)
or [`yarn add` command](https://classic.yarnpkg.com/en/docs/cli/add):

```bash
$ npm install @flexiblepersistence/sequelize
```

or

```bash
$ yarn add @flexiblepersistence/sequelize
```

## Tests

To run the test suite, first install Docker and dependencies, then run
`docker-compose up -d` and `npm test`:

```bash
$ docker-compose up -d
$ npm install
$ npm test
```

or

```bash
$ docker-compose up -d
$ yarn
$ yarn test
```

## People

The original author of Journaly is [Judah Lima](https://github.com/Judahh)

[List of all contributors](https://github.com/Judahh/sequelizePersistence/graphs/contributors)
