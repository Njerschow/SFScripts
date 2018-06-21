const proxy = require('http-proxy-middleware');
const fs = require('fs');

module.exports = function(options) {
//TODO: put file reading in seperate file, URLEncode in seperate file
    // if (!options.htmlFile) {
    //     options.htmlFile = "";
    //     fs.readFile(join(__dirname + './../../public/query.html'), function(err, data) {
    //         if (!err) {
    //             options.htmlFile=data.toString();
    //         }
    //     });
    // }

	let queryResolver = function(object) {
        let qs = '?' + Object.keys( object ).map(function( key ) {
            return encodeURIComponent( key ) + '=' + encodeURIComponent( object[ key ])
        }).join('&');
        return qs;
    };

    var proxyoptions = {
        target: options.queryURL.protocol+'//'+options.queryURL.hostname, // target host
        changeOrigin: true,               // needed for virtual hosted sites
        pathRewrite: function (path, req) { 
            console.log(options.queryURL);
            console.log(options.queryURL.path + queryResolver(req.query));
            return options.queryURL.path + queryResolver(req.query); },

        onProxyReq : function(proxyReq, req, res) {
            proxyReq.setHeader('Authorization', 'OAuth ' + options.access_token);
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('accept-encoding', 'gzip;q=0,deflate,sdch');
        },
        logProvider : function(provider) {
          var logger = new (require('bole').output({level: 'debug', stream: process.stdout})('index'));
          return logger;
      },
  };

  return proxy(proxyoptions)
}