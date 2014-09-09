var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , Container = require('../index')
  , Clank = require('clank');

chai.use(sinonChai);
chai.should();


describe( "when resolving Objects", function(){
  var container;

  beforeEach(function(){
    container = new Container()
  })  

  it( 'should return an instance', function(){
    var Thing = sinon.spy(function spy(){})

    container.register('thing:main', Thing)
    container.resolve('thing:main').should.be.an.instanceOf(Thing)
    Thing.should.have.been.calledOnce
  })

  it( 'should use the create method if it exists', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })

    sinon.spy(Thing, 'create')

    container.register('thing:main', Thing)
    container.resolve('thing:main')

    Thing.create.should.have.been.calledOnce
  })
  
  it( 'should respect Instantiate option', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })

    container.register('thing:main', Thing)

    container.resolve('thing:main').should.be.an.instanceOf(Thing)

    container.register('thing:second', Thing, { instantiate: false })

    container.resolve('thing:second').should.equal(Thing)
  })

  it( 'should respect Instantiate Type option', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })

    container.optionsForType('thing', { instantiate: false })

    container.register('thing:main', Thing)

    container.resolve('thing:main').should.equal(Thing)

  })

  it( 'should respect Singleton option', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })

    container.register('thing:main', Thing)
    container.register('thing:second', Thing, { singleton: false })

    container.resolve('thing:main').should.be.an.instanceOf(Thing)
      .and.equal(container.resolve('thing:main'))

    container.resolve('thing:second').should.be.an.instanceOf(Thing)
      .and.not.equal(container.resolve('thing:second'))
  })

  it( 'should respect Singleton Type option', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })

    container.optionsForType('thing', { singleton: false })

    container.register('thing:main', Thing)

    container.resolve('thing:main')
      .should.be.an.instanceOf(Thing)
        .and.not.equal(container.resolve('thing:main'))
  })

  it( 'should resolve type option before factory options', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })

    container.optionsForType('thing', { instantiate: false })

    container.register('thing:main', Thing, { instantiate: true})

    container.resolve('thing:main').should.be.an.instanceOf(Thing).and.not.equal(Thing)

  })

})

describe( 'when resolving Items not in registry', function(){
  var container, cb
    , Thing = function(){}
    , resolver;

  beforeEach(function(){
    resolver = sinon.spy(function(name){
      return Thing
    })

    container = new Container(resolver)
  }) 

  it( 'should call the resolver', function(){
    
    container.resolve('not-in-registry:main')
      .should.be.an.instanceOf(Thing)

    resolver.should.have.been.calledOnce.and.calledWith('not-in-registry:main')

  })

  it( 'should respect type options', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })
      , Injectable =  Clank.Object.extend({})

    container.resolve('thing').should.equal(container.resolve('thing'))

    container.optionsForType('thing', { singleton: false })

    container.resolve('thing').should.not.equal(container.resolve('thing'))
  })

  it( 'should only allow registering options for types', function(){

    (function(){
      container.optionsForType('thing', { singleton: false })

    }).should.not.throw();

    (function(){
      container.optionsForType('thing:main', { singleton: false })

    }).should.throw(TypeError);
  })

})

describe( 'when injecting objects', function(){
  var container;

  beforeEach(function(){
    container = new Container()
  }) 

  it( 'should return an instance with injections for registered Factory', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })
      , Injectable =  Clank.Object.extend({})

    container.register('thing:main', Thing)
    container.register('thing:second', Thing)
    container.register('injectable:main', Injectable)

    container.inject('thing:main', 'injectable', 'injectable:main')

    container.resolve('thing:main').should.be.an.instanceOf(Thing)
      .and.have.property('injectable')
        .that.is.an.instanceOf(Injectable)

    container.resolve('thing:second').should.be.an.instanceOf(Thing)
      .and.not.have.property('injectable')
  })

  it( 'should return an instance with injections for Type', function(){
    var Thing = Clank.Object.extend({ prop: 'hello' })
      , Injectable =  Clank.Object.extend({})

    container.register('thing:main', Thing)
    container.register('thing:second', Thing)

    container.register('injectable:main', Injectable)

    container.inject('thing', 'injectable', 'injectable:main')

    container.resolve('thing:main').should.be.an.instanceOf(Thing)
      .and.have.property('injectable')
        .that.is.an.instanceOf(Injectable)

    container.resolve('thing:second').should.be.an.instanceOf(Thing)
      .and.have.property('injectable')
        .that.is.an.instanceOf(Injectable)
  })
})