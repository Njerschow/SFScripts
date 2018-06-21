var proxy = require('http-proxy-middleware');

module.exports = function(options) {

	let queryResolver = function(object) {
		let qs = '?' + Object.keys( object ).map(function( key ) {
            return encodeURIComponent( key ) + '=' + encodeURIComponent( object[ key ])
        }).join('&');
        return qs;
    };

	var proxyoptions = {
        target: options.authURL.protocol+'//'+options.authURL.hostname, // target host
        changeOrigin: true,               // needed for virtual hosted sites
        pathRewrite: {
            '^/sf/auth' : options.authURL.path + queryResolver(options.authParams)
        },
        logProvider : function(provider) {
    		var logger = new (require('bole').output({level: 'debug', stream: process.stdout})('index'));
    		return logger;
    	},
    };

    return proxy(proxyoptions)
}