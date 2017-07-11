'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pomaceBase = require('pomace-base');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Router = function () {
  function Router() {
    _classCallCheck(this, Router);

    this.times = 0;
    this.paths = {};
    this.events = {};
    this.current = '/';
    this.currentParams = {};
    this.records = [];
    this.__beforeHash__ = null;
    this.__replaceHash__ = false;
    this.__noHash__ = false;
    this.__on__ = {
      entryBefore: function entryBefore(n) {
        n();
      },
      entryAfter: function entryAfter() {},
      leaveBefore: function leaveBefore(n) {
        n();
      },
      leaveAfter: function leaveAfter() {}
    };
  }

  _createClass(Router, [{
    key: 'init',
    value: function init(cb) {
      var _this = this;

      if (typeof cb !== 'function') {
        throw 'router init params must be a function';
      }

      var p = {};
      var __noHash__ = this.__noHash__;


      p.indexPath = function (flow) {
        _this.paths['/'] = flow;
        _this.events['/'] = {};
        for (var k in flow) {
          _this.events['/'][k] = new Function();
        }
      };

      p.path = function (n, flow) {
        _this.paths[n] = flow;
        _this.events[n] = {};
        for (var k in flow) {
          _this.events[n][k] = new Function();
        }
      };

      p.entry = function (type, cb) {
        if (typeof type !== 'string') {
          throw 'route operation type must be a string';
        }

        type = '' + type.charAt(0).toUpperCase() + type.substr(1, type.length);
        var key = 'entry' + type;

        if (typeof cb === 'function' && _this.__on__.hasOwnProperty(key)) {
          _this.__on__[key] = cb.bind(_this);
        }
      };

      p.doth = function () {
        var hash = location.hash.indexOf('?') > 0 ? location.hash.split('?')[0] : location.hash;
        var routerName = hash.replace(/^#\//, '');

        _this.__doth__(routerName);
      };

      switch (cb(p)) {
        case 'NO_HASH':
          (0, _pomaceBase.debug)('[router] change to not Hash mode now');
          break;
        default:
          if (!__noHash__) {
            window.addEventListener('hashchange', function () {
              var hash = location.hash.indexOf('?') > 0 ? location.hash.split('?')[0] : location.hash;
              _this.__doth__(hash.replace(/^#\//, ''));
            });
          }
      }
    }
  }, {
    key: 'replace',
    value: function replace(routeName) {
      var __noHash__ = this.__noHash__;


      if (!__noHash__) {
        this.__replacHash__ = true;
        history.back();
      }

      this.go(routeName);
    }
  }, {
    key: 'back',
    value: function back() {
      var times = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var __noHash__ = this.__noHash__;


      for (var i = 0; i < times; i++) {
        this.records.pop();
      }

      var record = this.records[this.records.length - 1];

      if (record) {
        this.__doth__(record.routeName, record.params);
        this.times -= times;

        if (this.times < 0) {
          this.times = 0;
        }
      }

      if (!__noHash__) {
        history.back();
      }
    }
  }, {
    key: 'go',
    value: function go() {
      var routeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
      var params = arguments[1];
      var __noHash__ = this.__noHash__,
          records = this.records,
          times = this.times;

      var hashParams = [];

      for (var k in params) {
        hashParams.push(k + '=' + params[k]);
      }

      hashParams = hashParams.join('&') === '' ? '' : '?' + hashParams.join('&');

      if (!__noHash__) {
        location.hash = '#' + (routeName.indexOf('/') === 0 ? routeName : '/' + routeName) + hashParams;
      } else {
        this.__doth__(routeName, params);
      }
    }
  }, {
    key: '__doth__',
    value: function __doth__() {
      var routeName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var paths = this.paths,
          times = this.times,
          __replaceHash__ = this.__replaceHash__,
          __beforeHash__ = this.__beforeHash__,
          __on__ = this.__on__;

      var routeParams = {};

      if (/^\s{0,}$/.test(routeName)) {
        routeName = '/';
      }

      this.current = routeName;

      if (!paths.hasOwnProperty(routeName)) {
        var isFind = false;

        for (var n in paths) {
          if (/\/:[a-zA-Z0-9_]{0,}/g.test(n)) {
            var path = n.split('/');
            var toPath = routeName.split('/');
            var is = true;

            for (var i = 0; i < toPath.length; i++) {
              if (path[i] !== toPath[i] && path[i].indexOf(':') !== 0) {
                is = false;
              } else if (path[i].indexOf(':') === 0) {
                routeParams[path[i].replace(/\:/g, '')] = toPath[i];
                continue;
              }
            }

            if (is) {
              routeName = n;
              isFind = is;
              break;
            } else {
              routeParams = {};
            }
          }
        }

        if (!isFind) {
          throw '[router] route ' + routeName + ' not defined';
        }
      }

      if (__replaceHash__) {
        this.__replaceHash__ = false;
        return;
      }

      var routeFlow = paths[routeName];
      var routeFlowHappen = paths[routeName];
      var hash = location.hash;

      if (!routeFlow) {
        throw 'Route ' + routeName + ' not defined..';
      }

      if (hash.indexOf('?') > 0) {
        hash = hash.split('?')[1];
        hash = hash.split('&');
        hash.map(function (kv) {
          kv = kv.split('=');
          params[kv[0]] = kv[1];
        });
      }

      this.currentParams = params;
      this.currentRouteParams = routeParams;

      if (typeof routeFlow.leave === 'function' && __beforeHash__ !== routeName) {
        __on__.leaveBefore(function () {
          if (!routeFlow.leave()) {
            __on__.leaveAfter();
          }
        });
      }

      if (typeof routeFlow.entry === 'function') {
        this.records.push({ routeName: routeName, params: params });
        __on__.entryBefore(function () {
          if (!routeFlow.entry()) {
            __on__.entryAfter();
          }
        });
        this.__beforeHash__ = times % 2 === 0 ? routeName : __beforeHash__;
        this.times++;
      }
    }
  }]);

  return Router;
}();

exports.default = Router;