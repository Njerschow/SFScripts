const Salesforce = require('./salesforce.js');
const log = require('bole')('salesforce/router');
const router = require('express').Router();
const path = require('path')

module.exports = function(options) {
	const SF_instance = new Salesforce(options);

	router.get('/auth', function(req, res) {
		SF_instance.authorize()
			.then((obj) => {
				res.send(obj.body);
			})
			.catch(err => {
				console.log(err);
			});
	});

	router.get('/token', function(req, res) {
		params = {"code": req.query.code};
		SF_instance.getToken(params)
			.then( (access_token) => {
				options.access_token = access_token;
				log.info('retrieved access token');
				res.sendFile(path.join(__dirname + './../../public/query.html'));
			})
			.catch( (error) => {
				log.error(error.message);
			});
	});

	router.get('/query', function(req, res) {
		let query = req.query.query;
		if (req.query.phrase && req.query.client) {
			//additional query resolving code here.
		}

		SF_instance.runQuery(query, options.access_token)
			.then( (obj) => {
				res.send(obj.body);
			})
			.catch( (err) => {
				log.error(error.message);
			});
	});

	return router;
}