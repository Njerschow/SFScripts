const RequestPromise = require('./request-promise');
const requestPromise = new RequestPromise();


module.exports = function(options) {

	authorize = function() {
		return requestPromise.makeRequest('get', null, options.authURL, options.authParams);
	}

	getToken = function(params) {
		return requestPromise.makeRequest('post', null, options.tokenURL, {...options.tokenParams, ...params})
			.then(function(obj) {
				let data = JSON.parse(obj.body);
				let access_token = data['access_token'];
				return Promise.resolve(access_token);
			})
			.catch(function(error) {
				console.log(error.message);
			});
	}

	runQuery = function(query, access_token) {
		let headers = { 
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'OAuth ' + access_token 
		};

		return requestPromise.makeRequest('get', headers, options.queryURL, {'q':query});
	}

	return {
		authorize:authorize,
		getToken:getToken,
		runQuery:runQuery
	}
}