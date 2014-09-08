var _ = require('lodash');

module.exports = Resolver

function Resolver (parent){
	this.parent = parent
}

Resolver.prototype = {

	resolve: function(path){
		var parts = path.split(':')
		  , type = parts[0]
		  , name = parts[1]
		  , key, factory;

	  	if ( type === 'model')
	  		key = name.charAt(0).toUpperCase() + name.substr(1)

		else if (type === 'collection')
	  		key = name.charAt(0).toUpperCase() + name.substr(1) + 'Collection'

	  	else if (type === 'store')
	  		key = name.charAt(0).toUpperCase() + name.substr(1) + 'Store'

	  	else if (type === 'view')
	  		key = name.charAt(0).toUpperCase() + name.substr(1) + 'View'

	  	else if (type === 'actions')
	  		key = name.charAt(0).toUpperCase() + name.substr(1) + 'Actions'

	  	factory = this.parent[key]

	  	if( factory) return factory
	}
}

