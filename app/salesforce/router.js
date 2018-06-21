const log = require('bole')('salesforce/router');
const router = require('express').Router();
const path = require('path')

module.exports = function(options) {
	const salesforce = require('./salesforce.js')(options);

	authproxy = require('./auth-proxy.js')(options);
	tokenproxy = require('./token-proxy.js')(options);
	queryproxy = require('./query-proxy.js')(options);
	
	router.use('/auth', authproxy);
	router.use('/token', tokenproxy);
	router.use('/query', queryproxy);

	return router;
}