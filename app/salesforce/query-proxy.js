const proxy = require('http-proxy-middleware');
const utility = require('./../utility.js');
const queryResolve = require('./query-resolve.js');

module.exports = function(options) {

    if (!options.queryTable) {
        utility.readAVMs(options);
    }

    var proxyoptions = {
        target: options.queryURL.protocol+'//'+options.queryURL.hostname, // target host
        changeOrigin: true,               // needed for virtual hosted sites
        pathRewrite: function (path, req) { 
            if (req.query.phrase) {
                req.query.q = queryResolve(req.query.phrase, req.query.X, options);
            }
            return options.queryURL.path + '?' + utility.URLEncode(req.query); },

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