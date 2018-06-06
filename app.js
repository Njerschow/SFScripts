const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const url = require('url');
require('dotenv').config();
CONFIG = require('./config.json');
router = require('./router.js');
const proxy = require('proxy-express');


const port = process.env.PORT || 3000;


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));
app.use('/', router.router);

console.log(router.SFAuthParams);

app.use(proxy(router.authURL.hostname, {
	log : true,
	request : {
		forceHttps : true,
		query : router.SFAuthParams,	
	},
	prefix : 'authorize'
}));

app.use(proxy(router.tokenURL.hostname, { //Not working yet, waiting for feedback from Kostya
	log : true,
	prefix : 'gettoken',
	pre : function(proxyObj) {
		console.log('here');
		proxyObj.reqOpts.method = 'POST';
		return this;
	},
	request : {
		query : router.SFTokenParams,
	}
}));



app.listen(port);
console.log("listening on port 3000");

////////////////////////https://login.salesforce.com/services/oauth2/authorize/



