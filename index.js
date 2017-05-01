// Code adapted from connect-redis (https://github.com/tj/connect-redis)

import { Store } from 'express-session'
import debugFactory from 'debug'

const debug = debugFactory('session-cache-manager')

// day in seconds
const oneDay = 86400
const noop = function () {}

export default class SessionCacheManager extends Store {
  /**
   * @param {CacheManager} cacheManager instance of node-cache-manager
   * @param {object} options
   */
  constructor (cacheManager, options = {}) {
    super(options)

    this.store = cacheManager
    this.prefix = options.prefix === null ? 'sess:' : options.prefix
    this.serializer = options.serializer || JSON
    this.ttl = options.ttl || oneDay
    this.disableTTL = options.disableTTL
  }

  /**
   * Get a session
   * @param {String} sid
   * @param {Function} cb (err, result)
   */
  get (sid, cb = noop) {
    const psid = this.prefix + sid

    this.store.get(psid, (err, data) => {
      if (err) {
        return cb(err)
      }

      if (!data) {
        return cb(err, null)
      }

      let result = null

      data = data.toString()

      debug('GOT %s', data)

      try {
        result = this.serializer.parse(data)
      } catch (er) {
        return cb(er)
      }

      return cb(null, result)
    })
  }

  /**
   * Set a session
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} cb
   */
  set (sid, sess, cb = noop) {
    const resolvedSID = this.prefix + sid
    let serializedSess = null
    let ttl = null

    try {
      serializedSess = this.serializer.stringify(sess)
    } catch (er) {
      return cb(er)
    }

    if (!this.disableTTL) {
      ttl = this.getTTL(sess)

      debug('SET "%s" %s ttl:%s', sid, serializedSess, ttl)
    } else {
      debug('SET "%s" %s', sid, serializedSess)
    }

    this.store.set(resolvedSID, serializedSess, { ttl }, (err) => {
      if (err) {
        return cb(err)
      }

      debug('SET complete')
      cb(null, null)
    })
  }

  getTTL (sess) {
    let maxAge = sess.cookie.maxAge
    return this.ttl || (typeof maxAge === 'number'
        ? Math.floor(maxAge / 1000)
        : oneDay)
  }

  /**
   * Removes the session
   * @param {String|Array} sid
   * @param {Function} cb
   */
  destroy (sid, cb = noop) {
    debug('DEL "%s"', sid)

    const prefix = this.prefix

    if (Array.isArray(sid)) {
      sid.forEach((sessID) => {
        this.store.del(prefix + sessID)
      })

      return cb(null, null)
    }

    sid = this.prefix + sid
    this.store.del(sid, cb)
  }

  length (cb) {
    this.store.keys(this.prefix, (err, rslts) => {
      if (err) {
        return cb(err, null)
      }

      debug('LENGTH %s', rslts.length)

      cb(null, rslts.length)
    })
  }

  /**
   * Refresh the TTL for the session
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} cb
   */
  touch (sid, sess, cb = noop) {
    debug('TOUCH "%s" %s', sid)

    if (this.disableTTL) {
      return cb(null, null)
    }

    this.set(sid, sess, cb)
  }
}
