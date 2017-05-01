# express-session-cache-manager

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](http://standardjs.com) [![Build Status](https://travis-ci.org/theogravity/express-session-cache-manager.svg?branch=master)](https://travis-ci.org/theogravity/express-session-cache-manager) [![npm version](https://badge.fury.io/js/express-session-cache-manager.svg)](https://badge.fury.io/js/express-session-cache-manager)

[express-session](https://www.npmjs.com/package/express-session) support using [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager),
which supports a [variety of storage engines](https://github.com/BryanDonovan/node-cache-manager#store-engines).

## Installation

`npm i express-session-cache-manager --save`

## Usage

```
import express from 'express'
import session from 'express-session'
import cacheManager from 'cache-manager'
import CacheManagerStore from 'express-session-cache-manager'

// Replace with your cache-manager specific store engine here
import memoryStoreEngine from 'cache-manager-memory-store'

const app = express()

const sessionMiddleware = session({
  store: new CacheManagerStore(cacheManager.caching({
    store: memoryStoreEngine
  }))
})

app.use(sessionMiddleware)

```

## Extended logging

The `debug` module is used to provide debug information.

Enable the following environment variable to see them:

`DEBUG=session-cache-manager`

## Acknowledgements

- Store logic adapted from [connect-redis](https://github.com/tj/connect-redis)
- Test logic adapted from [level-session-store](https://raw.githubusercontent.com/scriptoLLC/level-session-store)
