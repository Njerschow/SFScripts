const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
var request = require('request');

const app = express();

app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: false }));

let ACCESS_TOKEN    = null;
const CLIENT_ID     = "3MVG9zlTNB8o8BA2JCJccajQ5dAB7DY5sl7EDrDTKmL14ZQEjd17JD.xWNw6UYeQ3doarZ7jBi1ThIIKENKUj";
const CLIENT_SECRET = "921704916626058993";

const authURL  = "https://login.salesforce.com/services/oauth2/authorize";
const tokenURL = "https://login.salesforce.com/services/oauth2/token";
const queryURL = "https://na59.salesforce.com/services/data/v20.0/query";

const SFAuthParams = {
	response_type : 'code',
	client_id     : CLIENT_ID,
	redirect_uri  : "http://localhost:3000/auth",
	state         : null,
};
const SFTokenParams = {
	grant_type    : "authorization_code", // needs to be authorization_code for token endpoint
	client_secret : CLIENT_SECRET,
	client_id     : CLIENT_ID,
	redirect_uri  : "http://localhost:3000/token",
	code          : null,
	state         : null,
};
const SFQueryParams = {
	q             : "SELECT name FROM Account lIMIT 6",
};

const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.get('/', (req,res)=> {
	console.log("new connection");
	request.get({"url":authURL, "qs":SFAuthParams}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
     		res.send(body); // Print the google web page.
     	} else {
     		res.send("Error: most likely redirect_uri mismatch between querystring parameters and connected app.")
     	}
  	});

});

app.get('/auth', function(req,res) {
	SFTokenParams.code  = req.query.code;
	SFTokenParams.state = req.query.state; //optional, must be passed in above during the auth phase.

	request.post({"url":tokenURL, "qs":SFTokenParams}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			let data = JSON.parse(body);
			ACCESS_TOKEN = data['access_token'];
			request.get({'headers': { 'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Bearer '+ACCESS_TOKEN }, 'url':queryURL, 'qs': SFQueryParams}, 
				function(error, response, body) {
				if (!error && response.statusCode == 200) {
     				res.send(body); // Print the google web page.
     			} else {
     				console.log(error);
     			}
     		});
 		} else {
			res.send("Error: most likely redirect_uri mismatch between querystring parameters and connected app.")
		}
  	});
});


app.listen(3000);
console.log("listening on port 3000");

//https://login.salesforce.com/services/oauth2/authorize?client_id=3MVG9zlTNB8o8BA2JCJccajQ5dAB7DY5sl7EDrDTKmL14ZQEjd17JD.xWNw6UYeQ3doarZ7jBi1ThIIKENKUj"
//https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=3MVG9zlTNB8o8BA2JCJccajQ5dAB7DY5sl7EDrDTKmL14ZQEjd17JD.xWNw6UYeQ3doarZ7jBi1ThIIKENKUj&redirect_uri=https%3A%2F%2Fwww.secondmind.ai