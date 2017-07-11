import { debug, } from 'pomace-base';

export default class Router{

  constructor(){
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
      entryBefore(n){n();},
      entryAfter(){},
      leaveBefore(n){n();},
      leaveAfter(){},
    };
  }

  init(cb){
    if(typeof cb !== 'function'){
      throw 'router init params must be a function';
    }

    const p = {};
    const {__noHash__} = this;

    p.indexPath = (flow) => {
      this.paths['/'] = flow;
      this.events['/'] = {};
      for(const k in flow){
        this.events['/'][k] = new Function();
      }
    };

    p.path = (n,flow) => {
      this.paths[n] = flow;
      this.events[n] = {};
      for(const k in flow){
        this.events[n][k] = new Function();
      }
    };

    p.entry = (type,cb) => {
      if(typeof type !== 'string'){
        throw 'route operation type must be a string';
      }

      type = `${type.charAt(0).toUpperCase()}${type.substr(1,type.length)}`;
      const key = `entry${type}`;

      if(typeof cb === 'function' && this.__on__.hasOwnProperty(key)){
        this.__on__[key] = cb.bind(this);
      }
    };

    p.doth = () => {
      const hash = location.hash.indexOf('?') > 0? location.hash.split('?')[0]:location.hash;
      const routerName = hash.replace(/^#\//,'');

      this.__doth__(routerName);
    };

    switch(cb(p)){
     case 'NO_HASH':
       debug('[router] change to not Hash mode now');
     break;
     default:
       if(!__noHash__){
         window.addEventListener('hashchange',()=>{
           const hash = location.hash.indexOf('?') > 0? location.hash.split('?')[0]:location.hash;
           this.__doth__(hash.replace(/^#\//,''));
         });
       }
    }
  }

  replace(routeName){
    const {__noHash__} = this;

    if(!__noHash__){
      this.__replacHash__ = true;
      history.back();
    }

    this.go(routeName);
  }

  back(times=1){
    const {__noHash__} = this;

    for(let i=0;i<times;i++){
      this.records.pop();
    }

    const record = this.records[this.records.length-1];

    if(record){
      this.__doth__(record.routeName,record.params);
      this.times-=times;

      if(this.times < 0){
        this.times = 0;
      }
    }

    if(!__noHash__){
      history.back();
    }
  }

  go(routeName = '/', params){
    const {__noHash__,records,times} = this;
    let hashParams = [];

    for(const k in params){
      hashParams.push(`${k}=${params[k]}`);
    }

    hashParams = hashParams.join('&')===''?'':`?${hashParams.join('&')}`;

    if(!__noHash__){
      location.hash = `#${routeName.indexOf('/') === 0? routeName:`/${routeName}`}${hashParams}`;
    }else{
      this.__doth__(routeName,params);
    }
  }

  __doth__(routeName = '/',params = {}){
    const {paths,times,__replaceHash__,__beforeHash__,__on__} = this;
    let routeParams = {};

    if(/^\s{0,}$/.test(routeName)){
      routeName = '/';
    }

    this.current = routeName;

    if(!paths.hasOwnProperty(routeName)){
      let isFind = false;

      for(const n in paths){
        if(/\/:[a-zA-Z0-9_]{0,}/g.test(n)){
          const path = n.split('/');
          const toPath = routeName.split('/');
          let is = true;

          for(let i=0;i<toPath.length;i++){
            if(path[i] !== toPath[i] && path[i].indexOf(':') !== 0){
              is = false;
            }else if(path[i].indexOf(':') === 0){
              routeParams[path[i].replace(/\:/g,'')] = toPath[i];
              continue;
            }
          }

          if(is){
            routeName = n;
            isFind = is;
            break;
          }else{
            routeParams = {};
          }
        }
      }

      if(!isFind){
        throw `[router] route ${routeName} not defined`;
      }
    }

    if(__replaceHash__){
      this.__replaceHash__ = false;
      return;
    }

    const routeFlow = paths[routeName];
    const routeFlowHappen = paths[routeName];
    let hash = location.hash;

    if(!routeFlow){
      throw `Route ${routeName} not defined..`;
    }

    if(hash.indexOf('?') > 0){
      hash = hash.split('?')[1];
      hash = hash.split('&');
      hash.map(kv => {
        kv = kv.split('=');
        params[kv[0]] = kv[1];
      });
    }

    this.currentParams = params;
    this.currentRouteParams = routeParams;

    if(typeof routeFlow.leave === 'function' && __beforeHash__ !== routeName){
      __on__.leaveBefore(()=>{
        if(!routeFlow.leave()){
          __on__.leaveAfter();
        }
      });
    }

    if(typeof routeFlow.entry === 'function'){
      this.records.push({routeName,params});
      __on__.entryBefore(()=>{
        if(!routeFlow.entry()){
          __on__.entryAfter();
        }
      });
      this.__beforeHash__ = times%2 === 0? routeName:__beforeHash__;
      this.times++;
    }
  }
}
