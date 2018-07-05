var proxy = require('http-proxy-middleware');
const utility = require('./../utility.js');

module.exports = function(options) {

	var proxyoptions = {
        target: options.authURL.protocol+'//'+options.authURL.hostname, // target host
        changeOrigin: true,               // needed for virtual hosted sites
        pathRewrite: {
            '^/sf/auth' : options.authURL.path + '?' + utility.URLEncode(options.authParams)
        },
        logProvider : function(provider) {
    		var logger = new (require('bole').output({level: 'debug', stream: process.stdout})('index'));
    		return logger;
    	},
    };

    return proxy(proxyoptions)
}