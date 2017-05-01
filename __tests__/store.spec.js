// adapted from https://raw.githubusercontent.com/scriptoLLC/level-session-store/master/test.js

/* global beforeEach, afterEach, it, expect */

import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import cacheManager from 'cache-manager'
import memoryStore from 'cache-manager-memory-store'
import request from 'request'

import CacheManagerStore from '../index'

let store = null
let mw = null
let server = null

beforeEach((done) => {
  const app = express()

  store = new CacheManagerStore(cacheManager.caching({
    store: memoryStore
  }))

  mw = session({
    store,
    key: 'sid',
    secret: 'foobar',
    resave: true,
    saveUninitialized: true,
    unset: 'destroy'
  })

  server = app.use(cookieParser())
    .use(mw)
    .get('/', (req, res) => {
      if (typeof req.session === 'undefined') {
        return res.status(500).send('no')
      }
      res.send('ok')
    })
    .get('/bye', (req, res) => {
      req.session.destroy()
      res.send('ok')
    })
    .get('/nuke', (req, res) => {
      store.destroy(req.cookies.sid, () => {
        res.send()
      })
    })
    .get('/touch', (req, res) => {
      store.touch(req.cookies.sid, req.session, () => {
        res.send()
      })
    })
    .listen(1234, () => {
      done()
    })
})

afterEach((done) => {
  server.close()
  done()
})

it('should store the session', (done) => {
  request.get('http://localhost:1234/', (err, res) => {
    expect(!!err, 'no errors').toBe(false)
    expect(res.headers['set-cookie'], 'setting a cookie').toBeDefined()

    store.length((err, len) => {
      expect(!!err, 'no errors').toBe(false)
      expect(len, 'there is a session').toBe(1)
      done()
    })
  })
})

it('should delete a session', (done) => {
  request.get('http://localhost:1234/', (err, res) => {
    expect(!!err, 'no errors').toBe(false)
    expect(res.headers['set-cookie'], 'setting a cookie').toBeDefined()

    const jar = request.jar()
    const cookieVal = res.headers['set-cookie'][0].split('%3A')[1].split('.')[0]
    const cookie = request.cookie('sid=' + cookieVal)

    jar.setCookie(cookie, 'http://localhost:1234')

    request({url: 'http://localhost:1234/bye', jar: jar}, () => {
      store.length((err, len) => {
        expect(!!err, 'no errors').toBe(false)
        expect(len, 'there is a session').toBe(1)
        done()
      })
    })
  })
})

it('should return a falsy value when getting a non-existing session', (done) => {
  const store = new CacheManagerStore(cacheManager.caching({
    store: memoryStore
  }))

  store.get('bar', (err, session) => {
    expect(!!err, 'no errors').toBe(false)
    expect(session, 'session was falsy').toBe(null)
    done()
  })
})

it('should delete the session from the store', (done) => {
  request.get('http://localhost:1234/', (err, res) => {
    expect(!!err, 'no errors').toBe(false)

    const jar = request.jar()
    const cookieVal = res.headers['set-cookie'][0].split('%3A')[1].split('.')[0]
    const cookie = request.cookie('sid=' + cookieVal)

    jar.setCookie(cookie, 'http://localhost:1234')

    request({url: 'http://localhost:1234/nuke', jar: jar}, (err, res) => {
      expect(!!err, 'no errors').toBe(false)
      expect(res.statusCode, 'got 200').toBe(200)

      request({url: 'http://localhost:1234/', jar: jar}, (err, res) => {
        expect(!!err, 'no errors').toBe(false)
        expect(res.statusCode, 'got 200').toBe(200)
        done()
      })
    })
  })
})

it('should refresh the session', (done) => {
  request.get('http://localhost:1234/', (err, res) => {
    expect(!!err, 'no errors').toBe(false)

    const jar = request.jar()
    const cookieVal = res.headers['set-cookie'][0].split('%3A')[1].split('.')[0]
    const cookie = request.cookie('sid=' + cookieVal)

    jar.setCookie(cookie, 'http://localhost:1234')

    request({url: 'http://localhost:1234/touch', jar: jar}, (err, res) => {
      expect(!!err, 'no errors').toBe(false)
      expect(res.statusCode, 'got 200').toBe(200)

      request({url: 'http://localhost:1234/', jar: jar}, (err, res) => {
        expect(!!err, 'no errors').toBe(false)
        expect(res.statusCode, 'got 200').toBe(200)
        done()
      })
    })
  })
})
