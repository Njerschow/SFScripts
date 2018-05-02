const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');

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
	let str = fs.readFileSync(FILE_NAME,'utf8');

	rows = str.split(/\r?\n|\r/);
	rows.forEach( (row)=> {
		cols = row.split(/,/);
		QueryTable[cols[0]] = cols[1];
	});
}

function main() {

	readAVM();

	//phrase comes into the console. change this to change where the query comes from.
	stdin.addListener("data", sendQuery); 
}

function sendQuery(d) {
	SFQueryParams.q = resolveQuery(d.toString().trim(), "United Oil & Gas Corp.");
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
	let date = new Date(Date.now());
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth()+1;
	const quarter = Math.ceil(month/3);

	let Query = "";

	let action = QueryTable[phrase];

	//Code to get action taken --> action
	switch (action) {
		case "Get first quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=1 and Account.name LIKE '"+X+"'"
		break;
		case "Get second quarter sales numberr":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=2 and Account.name LIKE '"+X+"'";
		break;
		case "Get third quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=3 and Account.name LIKE '"+X+"'";
		break;
		case "Get fourth quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=4 and Account.name LIKE '"+X+"'";
		break;
		case "Get last quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter="+(quarter-1)+" and Account.name LIKE '"+X+"'";
		break;
		case "Get current quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter="+quarter+" and Account.name LIKE '"+X+"'";
		break;
		case "Get last year sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+(year-1)+" and Account.name LIKE '"+X+"'";
		break;
		case "Get current year sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and Account.name LIKE '"+X+"'";
		break;
		case "Get last sale amount for client":
		break;
		case "Get last sale UNITS amount for client":
		break;
		case "Pull last call AND meeting date with X":
		break;
		case "Pull last meeting date with X":
		break;
		case "Pull last call date with X":
		break;
		case "Pull the sales or customer support form called X":
		break;
		case "Pull the status for the Support Ticket #":
		break;
		case "Pull the status for open / latest Support Ticket PLUS Email":
		break;
		case "Pull the status for the Support Ticket":
		break;
		case "Pull status for open / latest Support Ticket":
		break;
		case "Pull Stage / Status and Next Steps":
		break;
		case "Pull Next Steps":
		break;
		case "Pull activity date":
		break;
		case "Get close date of last sale":
		break;
		case "Get main contact person at client ":
		break;
		case "Get main sales contact for client ":
		break;
		case "Get ALL sales contacts for client ":
		break;
		case "Get product purchased":
		break;
		case "Get # of seats sold in last sale":
		break;
		case "Get # of units sold in last sale":
		break;
		case "Get date proposal was sent":
		break;
		case "Get close probability":
		break;
		case "Get pricing for X":
		break;
		case "Get pricing on last sale for client":
		break;
		case "Get contact info":
		break;
		case "Get renewal date":
		break;
		case "Get notes":
		break;
		case "Get employee number for X":
		break;
		case "Get annual revenue for X":
		break;
		case "Get deal value ":
		break;
		case "Get support contact":
		break;
	}

	return Query;

}

main();




