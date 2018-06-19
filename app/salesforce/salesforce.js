const RequestPromise = require('./request-promise');
const requestPromise = new RequestPromise();

class SFClass {
	constructor(options) {
		this.authParams = options.authParams;
		this.authURL = options.authURL;
		this.tokenParams = options.tokenParams;
		this.tokenURL = options.tokenURL;
		this.queryParams = options.queryParams;
		this.queryURL = options.queryURL;
		this.access_token = options.access_token;	
	}

	authorize() {
		return requestPromise.makeRequest('get', null, this.authURL, this.authParams);
	}

	getToken(params) {
		return requestPromise.makeRequest('post', null, this.tokenURL, {...this.tokenParams, ...params})
			.then(function(obj) {
				let data = JSON.parse(obj.body);
				let access_token = data['access_token'];
				return Promise.resolve(access_token);
			})
			.catch(function(error) {
				console.log(error.message);
			});
	}

	runQuery(query, access_token) {
		let headers = { 
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer ' + access_token 
		};

		return requestPromise.makeRequest('get', headers, this.queryURL, {'q':query});
	}
}

module.exports = SFClass;