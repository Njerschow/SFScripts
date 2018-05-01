const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
var request = require('request');

const app = express();

app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: false }));

let ACCESS_TOKEN    = null;
const FILE_NAME     = "./public/AFAVM.csv"

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
	q             : "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear=2015 and FIscalQuarter=1 and Account.name LIKE 'United Oil & Gas Corp.'",
};

const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.get('/', (req,res)=> {
	console.log("new connection");
	request.get({"url":authURL, "qs":SFAuthParams}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
     		res.send(body); // Print the salesforce web page.
     	} else {
     		res.send("Error: " + error);
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
     			} else if (error) {
     				res.send(error + '\n\n' + body);
     			} else {
     				console.log(response);
     			}
     		});
		} else {
			res.send("Error: most likely redirect_uri mismatch between querystring parameters and connected app.")
		}
	});
});

app.listen(3000);
console.log("listening on port 3000");

////////////////////////

var stdin = process.openStdin();
let QueryTable = {}

function readAVM() {
	let file = new File(FILE_NAME);
	let str = "";
	while (!file.eof) {
		str += file.readln() + "\n";
	}
	file.close();

	rows = str.split(/\r?\n|\r/);
	rows.forEach( (row)=> {
		cols = row.split(/,/);
		QueryTable[cols[0]] = cols[2];
	});
}

function sendQuery(d) {
	SFQueryParams.q = d.toString().trim();
	if (ACCESS_TOKEN) {
		request.get({'headers': { 'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer '+ACCESS_TOKEN }, 'url':queryURL, 'qs': SFQueryParams}, 
			function(error, response, body) {
				if (!error && response.statusCode == 200) {
					let data = JSON.parse(body);
					data.records.forEach((ele) => {
						console.log(ele.Account);
					});
				}
     				//res.send(body); // Print the google web page.
     			else if (error) {

     				//res.send(error + '\n\n' + body);
     			} else {
     				console.log(response);
     			}
     		});
	}

}

function resolveQuery(phrase, X) {
	

}


function main() {
	stdin.addListener("data", sendQuery);



}

main();




