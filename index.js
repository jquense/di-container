var _ = require('lodash');

module.exports = Container

function Container (resolver, provider){
  this._resolve = resolver || _.noop

  this.registry = {}
  this.instanceCache = {}
  
  this._typeOptions = {}

  this._typeInjections = {}
  this._injections = {}
  this._injectedFactories = {}
}


Container.prototype = {

  factoryFor: function(name){
    var factory;

    if ( _.has(this._injectedFactories, name) )
      return  this._injectedFactories[name]

    factory = _.has(this.registry, name)
      ? this.registry[name].factory
      : this._resolve(name)

    if ( !factory || (typeof factory.extend !== 'function') || options(this, name).instantiate === false)
     return factory

    factory = this._injectedFactories[name] = createInjectedFactory(
        factory
      , propertyInjections(this, name)
      , ctorInjections(this, name))

    return factory
  },

  resolve: function(name){
    var item = this.registry[name]
      , opts = options(this, name)
      , factory = this.factoryFor(name)
      , inst;

    if( _.has(this.instanceCache, name) && opts.singleton !== false)
      return this.instanceCache[name]

    inst = opts.instantiate === false 
         ? factory 
         : createInjectedInstance(
              factory
            , propertyInjections(this, name)
            , ctorInjections(this, name))
  
    if ( opts.singleton !== false )
      this.instanceCache[name] = inst

    return inst
  },

  register: function(name, Factory, options){
    this.registry[name] = {
      options: options || {},
      factory: Factory
    }
  },

  inject: function(name, prop, target){
    var isForType = !_.contains(name, ':')

    addOrPush(isForType 
      ? this._typeInjections 
      : this._injections, 'prop', name, { prop: prop, name: target })

  },

  injectConstructor: function(name, prop, target){
    var isForType = !_.contains(name, ':')

    addOrPush(isForType 
      ? this._typeInjections 
      : this._injections, 'ctor', name, target)
  },

  optionsForType: function(type, options){
    if ( _.contains(type, ':')) 
      throw new TypeError('The type name (' + type +') cannot contain the delimiter ":" ')

    this._typeOptions[type] = _.extend(this._typeOptions[type] || {}, options)
  }
}

function createInjectedInstance(factory, propInjections, ctorInjections){

  if (typeof factory.extend === 'function')
    return new factory();

  if (typeof factory !== 'function')
    _.extend({}, this, propInjections)

  if (typeof factory.create === 'function')
    return factory.create(propInjections)

  InjectedConstructor.prototype = factory.prototype

  return new InjectedConstructor

  function InjectedConstructor(){
    _.extend(this, propInjections)
    factory.apply(this, ctorInjections || [])
  }
  
}

function createInjectedFactory(factory, propInjections, ctorInjections){
 
  if ( ctorInjections && ctorInjections.length ) 
    _.extend(propInjections, { 
      constructor: function InjectedConstructor(){
        factory.apply(this, ctorInjections || [])
      }
    })

  
  return factory.extend(propInjections)
}


function propertyInjections(ctx, name){
  var injections = injectionsForVector(ctx, 'prop', name)

  injections = _.transform(injections, function(obj, inject){
    var factory = ctx.resolve(inject.name) 

    if ( !factory ) throw new Error('unknown injection: ' + inject.name) 

    obj[inject.prop] = factory
  }, {})

  injections.container = ctx

  return injections
}

function ctorInjections(ctx, name){
  var injections = injectionsForVector(ctx, 'ctor', name)

  return _.map(injections, function(target){
    return ctx.resolve(target)
  })
}

function injectionsForVector(ctx, vector, name){
  var injections = []
    , typeInjections = (ctx._typeInjections[getType(name)] || {})[vector]
    , factoryInjections = (ctx._injections[name] || {})[vector];

  if ( typeInjections) 
    typeInjections = _.reject(typeInjections, { name: name })

  injections = [].concat(typeInjections || [])
  injections = injections.concat(factoryInjections || [])

  return injections
}



function options(ctx, name){
  var typeOpts = ctx._typeOptions[getType(name)] || {}
    , options = ctx.registry[name] && ctx.registry[name].options

  return _.extend({}, typeOpts, options )
}

function getType(name){
  if ( _.contains(name, ':') ) return name.split(':')[0]
  return name
}

function addOrPush(obj, injectionVector, key, val){
  var existing = (obj[key] || (obj[key] = {}))[injectionVector]

  obj[key][injectionVector] = existing 
    ? [].concat(existing, val) 
    : [].concat(val)
}