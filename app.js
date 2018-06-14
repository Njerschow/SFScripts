const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const url = require('url');
require('dotenv').config();
CONFIG = require('./config.json');
router = require('./router.js');
const proxy = require('express-http-proxy');


const port = process.env.PORT || 3000;


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));
app.use('/', router.router);

console.log(router.SFAuthParams);

app.use('/oauth2', proxy(router.authURL.hostname, {
	https: true,
	proxyReqPathResolver: function(req) {
		let qs = '?';
		for (var key in router.SFAuthParams) {
    		if (router.SFAuthParams.hasOwnProperty(key)) {
        		qs+=key.toString()+'='+router.SFAuthParams[key]+'&';
    		}
		}
		// router.authURL.query = qs
    	return router.authURL.path + qs;
  	},
}));

app.use('/token', proxy(router.tokenURL.hostname, { //preserveHostHdr?
	https: true,
	proxyReqPathResolver: function(req) {
		router.SFTokenParams.code = req.query.code;
		// let qs = '?';
		// for (var key in router.SFTokenParams) {
  //   		if (router.SFTokenParams.hasOwnProperty(key)) {
  //       		qs+=key.toString()+'='+router.SFTokenParams[key]+'&';
  //   		}
		// }
    	return router.tokenURL.path;
  	},
	proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
		proxyReqOpts.headers['Accept'] = 'application/json';
		proxyReqOpts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    	proxyReqOpts.method = 'POST';
    	return proxyReqOpts;
  	},
  	proxyReqBodyDecorator: function(bodyContent, srcReq) {
  		let qs = '';
		for (var key in router.SFTokenParams) {
    		if (router.SFTokenParams.hasOwnProperty(key)) {
        		qs+=key.toString()+'='+router.SFTokenParams[key]+'&';
    		}
		}
  		return qs;
  	},
  	skipToNextHandlerFilter: function(proxyRes) {
  		
  		// var body = '';
    // 	proxyRes.on('data', function(chunk) {
    //   		body += chunk;
    // 	});
    // 	console.log(body);
  		//proxyRes.next();
    	return false;
  	},
  	userResHeaderDecorator: function(headers, userReq, userRes, proxyReq, proxyRes) {
  		headers['Content-Type'] = 'text/html';
  		headers['strict-transport-security'] = null; //need to do so that this will switch back to http
  		headers['content-security-policy'] = null;
  		return headers;
  	},
  	userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
  		let data = JSON.parse(proxyResData);
		router.ACCESS_TOKEN = data['access_token'];
		CONFIG.AT = router.ACCESS_TOKEN;
		console.log("AT:"+router.ACCESS_TOKEN)
		//userRes.sendFile();
  // 		//let data = proxyResData.toString().split('<access_token>');
  // 		console.log(data);
  // 		data = data[1].split('</access_token>');
  // 		let access_token = data[0];
		// router.ACCESS_TOKEN = access_token;
		//userRes.sendFile(path.join(__dirname+'/public/query.html'));
		
    	console.log("NNNNNNNNJHKJKKKKKKKKKKKKKKKKJKKJKJKJJKJKJKJJKLKJLKJHLKJHLKJHLKJHLKJHLKJHLKJHBLKJHBLKJHBLKJHBBKBJHLKJBHLKJHLBKJH");
    	//userRes.redirect('/query');
    	return fs.readFileSync(path.join(__dirname+'/public/query.html')); // TODO: change to a promise
    	//return proxyResData;
  	},
}));



app.listen(port);
console.log("listening on port "+port);



