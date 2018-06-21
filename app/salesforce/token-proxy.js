const proxy = require('http-proxy-middleware');
const fs = require('fs');
const join = require('path').join;
const url = require('url');

module.exports = function(options) {

    if (!options.htmlFile) {
        options.htmlFile = "";
        fs.readFile(join(__dirname + './../../public/query.html'), function(err, data) {
            if (!err) {
                options.htmlFile=data.toString();
            }
        });
    }

	let bodyResolver = function(object) {
        let body = Object.keys( object ).map(function( key ) {
            return encodeURIComponent( key ) + '=' + encodeURIComponent( object[ key ])
        }).join('&');
        return body;
    };

    var proxyoptions = {
        target: options.tokenURL.protocol+'//'+options.tokenURL.hostname, // target host
        changeOrigin: true,               // needed for virtual hosted sites
        pathRewrite: {
            '^/sf/token' : options.tokenURL.path
        },
        onProxyReq : function(proxyReq, req, res) {
            if ( req.body ) delete req.body;

            req.method = 'POST';
            proxyReq.method = 'POST';

            body = bodyResolver({...options.tokenParams,...req.query});

            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            proxyReq.setHeader('Content-Length', body.length );
            proxyReq.setHeader('accept-encoding', 'gzip;q=0,deflate,sdch');

            proxyReq.write(body);
            proxyReq.end();
        },
        onProxyRes : function(proxyRes, req, res) {
            
            proxyRes.headers['Content-Type'] = 'text/html';
            proxyRes.headers['strict-transport-security'] = null; // to switch back to http
            proxyRes.headers['content-security-policy'] = null;


            var _write = res.write;
            var body = '';
            proxyRes.on('data', function(data) {
                body += data.toString('utf8');
            });

            proxyRes.on('end', function() {
                if (!options.access_token) {
                    parsedBody = JSON.parse(body.toString());
                    options.access_token = parsedBody.access_token;
                    options.queryURL = url.parse(parsedBody.instance_url + options.datacenter.endpoints.query);
                }
                _write.call(res,options.htmlFile);
                res.end();
            });

            res.write = (data) => {
                
            }
        },
        logProvider : function(provider) {
          var logger = new (require('bole').output({level: 'debug', stream: process.stdout})('index'));
          return logger;
      },
  };

  return proxy(proxyoptions)
}