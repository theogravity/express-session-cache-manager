'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _expressSession = require('express-session');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Code adapted from connect-redis (https://github.com/tj/connect-redis)

var debug = (0, _debug2.default)('session-cache-manager');

// day in seconds
var oneDay = 86400;
var noop = function noop() {};

var SessionCacheManager = function (_Store) {
  _inherits(SessionCacheManager, _Store);

  /**
   * @param {CacheManager} cacheManager instance of node-cache-manager
   * @param {object} options
   */
  function SessionCacheManager(cacheManager) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, SessionCacheManager);

    var _this = _possibleConstructorReturn(this, (SessionCacheManager.__proto__ || Object.getPrototypeOf(SessionCacheManager)).call(this, options));

    _this.store = cacheManager;
    _this.prefix = options.prefix === null ? 'sess:' : options.prefix;
    _this.serializer = options.serializer || JSON;
    _this.ttl = options.ttl || oneDay;
    _this.disableTTL = options.disableTTL;
    return _this;
  }

  /**
   * Get a session
   * @param {String} sid
   * @param {Function} cb (err, result)
   */


  _createClass(SessionCacheManager, [{
    key: 'get',
    value: function get(sid) {
      var _this2 = this;

      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

      var psid = this.prefix + sid;

      this.store.get(psid, function (err, data) {
        if (err) {
          return cb(err);
        }

        if (!data) {
          return cb(err, null);
        }

        var result = null;

        data = data.toString();

        debug('GOT %s', data);

        try {
          result = _this2.serializer.parse(data);
        } catch (er) {
          return cb(er);
        }

        return cb(null, result);
      });
    }

    /**
     * Set a session
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} cb
     */

  }, {
    key: 'set',
    value: function set(sid, sess) {
      var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;

      var resolvedSID = this.prefix + sid;
      var serializedSess = null;
      var ttl = null;

      try {
        serializedSess = this.serializer.stringify(sess);
      } catch (er) {
        return cb(er);
      }

      if (!this.disableTTL) {
        ttl = this.getTTL(sess);

        debug('SET "%s" %s ttl:%s', sid, serializedSess, ttl);
      } else {
        debug('SET "%s" %s', sid, serializedSess);
      }

      this.store.set(resolvedSID, serializedSess, { ttl: ttl }, function (err) {
        if (err) {
          return cb(err);
        }

        debug('SET complete');
        cb(null, null);
      });
    }
  }, {
    key: 'getTTL',
    value: function getTTL(sess) {
      var maxAge = sess.cookie.maxAge;
      return this.ttl || (typeof maxAge === 'number' ? Math.floor(maxAge / 1000) : oneDay);
    }

    /**
     * Removes the session
     * @param {String|Array} sid
     * @param {Function} cb
     */

  }, {
    key: 'destroy',
    value: function destroy(sid) {
      var _this3 = this;

      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;

      debug('DEL "%s"', sid);

      var prefix = this.prefix;

      if (Array.isArray(sid)) {
        sid.forEach(function (sessID) {
          _this3.store.del(prefix + sessID);
        });

        return cb(null, null);
      }

      sid = this.prefix + sid;
      this.store.del(sid, cb);
    }
  }, {
    key: 'length',
    value: function length(cb) {
      this.store.keys(this.prefix, function (err, rslts) {
        if (err) {
          return cb(err, null);
        }

        debug('LENGTH %s', rslts.length);

        cb(null, rslts.length);
      });
    }

    /**
     * Refresh the TTL for the session
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} cb
     */

  }, {
    key: 'touch',
    value: function touch(sid, sess) {
      var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;

      debug('TOUCH "%s" %s', sid);

      if (this.disableTTL) {
        return cb(null, null);
      }

      this.set(sid, sess, cb);
    }
  }]);

  return SessionCacheManager;
}(_expressSession.Store);

exports.default = SessionCacheManager;