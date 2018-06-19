const request = require('request');
const url = require('url');

class RequestPromise {
	constructor() {

	}

	/*
	 * @params type can be 'GET', 'POST', 'PUT', etc. // defaults to GET
	*/
	makeRequest(type, headers, requrl, params) {
		if (!type) {
			type = 'GET'
		} if (!url.parse(requrl)) {
			throw new Error('request url cannot be undefined');
		}

		type = type.toLowerCase();

		return new Promise( function(resolve, reject) {
			request[type]({"headers":headers, "url":requrl, "qs":params}, function (error, response, body) {
				if (!error) {
					resolve({'body': body, 'status': response.statusCode});
				} else {
					reject(error);
				}
			});
		});
	}
}

module.exports = RequestPromise;