const path = require('path');
const router = require('express').Router()
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const url = require('url');
require('dotenv').config();
CONFIG = require('./config.json');

let ACCESS_TOKEN    = null;
const FILE_NAME = CONFIG.salesforce.AVMFile;

const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const authURL  = url.parse(CONFIG.salesforce.oauth2.baseURL+CONFIG.salesforce.oauth2.endpoints.auth);
const tokenURL = url.parse(CONFIG.salesforce.oauth2.baseURL+CONFIG.salesforce.oauth2.endpoints.token);
const queryURL = url.parse(CONFIG.salesforce.datacenter.baseURL+CONFIG.salesforce.datacenter.endpoints.query);

const SFAuthParams = CONFIG.salesforce.SFAuthParams;
SFAuthParams['client_id'] = CLIENT_ID;

const SFTokenParams = CONFIG.salesforce.SFTokenParams;
SFTokenParams['client_id'] = CLIENT_ID;
SFTokenParams['client_secret'] = CLIENT_SECRET;

const SFQueryParams = CONFIG.salesforce.SFQueryParams;

console.log(CONFIG);

router.get('/', (req,res) => {
	res.redirect("/authorize" + authURL.path);
});

// router.get('/token', (req,res) => {
// 	SFTokenParams.code  = req.query.code;
// 	SFTokenParams.state = req.query.state;
// 	res.redirect("/gettoken"+tokenURL.path);
// });

router.get('/', (req,res)=> {
	console.log("new connection");
	request.get({"url":authURL, "qs":SFAuthParams}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
     		res.send(body); // Print the salesforce web page.
     	} else {
     		res.send("Error: " + error);
     	}
     });
});



router.get('/', (req,res)=> {
	console.log("new connection");
	request.get({"url":authURL, "qs":SFAuthParams}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
     		res.send(body); // Print the salesforce web page.
     	} else {
     		res.send("Error: " + error);
     	}
     });

});

router.get('/token', function(req,res) {
	SFTokenParams.code  = req.query.code;
	SFTokenParams.state = req.query.state; //optional, must be passed in above during the auth phase.

	request.post({"url":tokenURL, "qs":SFTokenParams}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			let data = JSON.parse(body);
			ACCESS_TOKEN = data['access_token'];
			res.sendFile(path.join(__dirname+'/public/query.html'));
		} else {
			res.send("Error: most likely redirect_uri mismatch between querystring parameters and connected router.")
		}
	});
});

router.get('/query', function(req, res) {
	if (!ACCESS_TOKEN) {
		SFQueryParams.q = req.query.query;
		res.redirect('/');
	}
	
	sendQuery(req.query.query, queryCallback.bind(this, res));
});

router.get('/phrase', function(req,res) {
	SFQueryParams.q = resolveQuery(req.query.phrase, req.query.client);
	console.log(SFQueryParams.q)
	if (!ACCESS_TOKEN) {
		res.redirect('/');
	}
	
	sendQuery(SFQueryParams.q, queryCallback.bind(this, res));
});

//// End router
//// start dependant functions

var stdin = process.openStdin();
let QueryTable = {}

function readAVM() {
	fs.readFile(FILE_NAME,'utf8', function(err, data) {
		let rows = data.split(/\r?\n|\r/);
		rows.forEach( (row)=> {
			cols = row.split(/,/);
			QueryTable[cols[0]] = cols[1];
		});
	});
}

function main() {

	readAVM();

	let onSuccess = function (data) {
		data.records.forEach((ele) => {
			console.log(ele);
		});
	};

	let callback = function (error, response, body) {
		if (!error && response.statusCode == 200) {
			let data = JSON.parse(body);
			onSuccess(data);
		} else if (error) {
		
		} else {
     		console.log(response.body);
     		
     	}
    };

	//phrase comes into the console. change this to change where the query comes from.
	stdin.addListener("data", (data) => { sendQuery(data, callback) });
}



/* NOTES:
For last sale number/UNITS with client, Think about changing from the Opportunity table to the Case table since it has a Close date and a link to Asset
*/

main();

queryCallback = function(res, error, response, body) {
	if (!error && response.statusCode == 200) {

		res.send(JSON.parse('{ "Query": "'+SFQueryParams.q+'", "result":['+body+']}'));
	}
}

function sendQuery(d, callback) {
	SFQueryParams.q = d.toString().trim();
	//SFQueryParams.q = resolveQuery(d.toString().trim(), "United Oil & Gas Corp.");
	if (ACCESS_TOKEN) {
		request.get({'headers': { 'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer '+ACCESS_TOKEN }, 'url':queryURL, 'qs': SFQueryParams}, callback);
	}
}

function resolveQuery(phrase, X) {
	let date = new Date(Date.now());
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth()+1;
	const quarter = Math.ceil(month/3);

	let Query = "";

	let action = QueryTable[phrase];

	let onSuccess = function (data) {
		data.records.forEach((ele) => {
			console.log(ele);
		});
		return data.records;
	};

	//default callback
	let callback = function (error, response, body) {
		if (!error && response.statusCode == 200) {
			let data = JSON.parse(body);
			returned = onSuccess(data);
			console.log(returned);
		} else if (error) {
		
		} else {
     		console.log("big fat error");
     	}
    };

    const totalSalesNumber = function (data) {
		let Amount = data.records.reduce((acc, ele) => {
			return acc+ele;
		});
		return Amount;
    };

	//Code to get action taken --> action
	switch (action) {
		case "Get first quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=1 and Account.name LIKE '"+X+"'"
		onSuccess=totalSalesNumber;
		break;
		case "Get second quarter sales numberr":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=2 and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get third quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=3 and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get fourth quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=4 and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get last quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter="+(quarter-1)+" and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get current quarter sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter="+quarter+" and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get last year sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+(year-1)+" and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get current year sales number":
		Query = "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear="+year+" and Account.name LIKE '"+X+"'";
		onSuccess=totalSalesNumber;
		break;

		case "Get last sale amount for client":
		Query = "SELECT Amount, CloseDate, StageName FROM Opportunity WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Get last sale UNITS amount for client":
		Query = "SELECT TotalOpportunityQuantity, CloseDate, StageName FROM Opportunity WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Pull last call AND meeting date with X": //TODO: fix meeting date
		Query = "SELECT ActivityDate,Subject,Description,Status FROM Task WHERE Account.name LIKE '"+X+"' ORDER BY ActivityDate DESC LIMIT 1";
		break;

		case "Pull last meeting date with X": //TODO: change to meeting date
		Query = "SELECT ActivityDate,Subject,Description,Status FROM Task WHERE Account.name LIKE '"+X+"' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Pull last call date with X":
		Query = "SELECT ActivityDate,Subject,Description,Status FROM Task WHERE Account.name LIKE '"+X+"' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Pull the sales or customer support form called X": // wasnt sure how to do this
		break;

		case "Pull the status for the Support Ticket #": // wasnt sure how to do this
		break;

		case "Pull the status for open / latest Support Ticket PLUS Email": // wasnt sure how to do this
		break;

		case "Pull the status for the Support Ticket": // wasnt sure how to do this
		break;

		case "Pull status for open / latest Support Ticket": // wasnt sure how to do this
		break;

		case "Pull Stage / Status and Next Steps":
		Query = "SELECT StageName, NextStep, CloseDate From Opportunity WHERE Account.name LIKE '"+X+"' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Pull Next Steps": //Opportunity.NextStep
		Query = "SELECT NextStep, CloseDate From Opportunity WHERE Account.name LIKE '"+X+"' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Pull activity date": //Task.ActivityDate
		Query = "SELECT ActivityDate From Task WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get close date of last sale": //Opportunity.CloseDate
		Query = "SELECT CloseDate From Opportunity WHERE Account.name LIKE '"+X+"' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Get main contact person at client ": 
		Query = "SELECT ContactEmail,Contact.Name, ContactPhone, ContactMobile FROM Case WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get main sales contact for client ":
		Query = "SELECT ContactEmail,Contact.Name, ContactPhone, ContactMobile FROM Case WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get ALL sales contacts for client ":
		Query = "SELECT ContactEmail,Contact.Name, ContactPhone, ContactMobile FROM Case WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get product purchased":
		Query = "SELECT Product2.Name, Opportunity.CloseDate From OpportunityLineItem WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";// This isnt right, not sure why
		break;

		case "Get # of seats sold in last sale": //Not sure what is meant by seats
		Query = "SELECT TotalOpportunityQuantity, CloseDate, StageName FROM Opportunity WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Get # of units sold in last sale": 
		Query = "SELECT TotalOpportunityQuantity, CloseDate, StageName FROM Opportunity WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Get date proposal was sent": //Not sure what to do here
		break;

		case "Get close probability":
		Query = "SELECT Probability FROM Opportunity WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get pricing for X": // Not sure where to find the price of products
		break;

		case "Get pricing on last sale for client":
		Query = "SELECT ExpectedRevenue FROM Opportunity WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Get contact info":
		Query = "SELECT ContactEmail,Contact.Name, ContactPhone, ContactMobile FROM Case WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get renewal date":
		break;

		case "Get notes":
		Query = "SELECT Description FROM Opportunity Where Account.name LIKE '"+X+"'";
		break;

		case "Get employee number for X":
		Query = "SELECT EmployeeNumber FROM User"; //Figure out how to filter by Account.Name since the User table does not have a relationship with Account
		break;

		case "Get annual revenue for X":
		Query = "SELECT AnnualRevenue FROM Account WHERE Account.name LIKE '"+X+"' ";
		break;

		case "Get deal value ":
		Query = "SELECT ExpectedRevenue FROM Opportunity WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get support contact":
		Query = "SELECT ContactEmail,Contact.Name, ContactPhone, ContactMobile FROM Case WHERE Account.name LIKE '"+X+"'";//TODO: not sure what is meant by support contact
		break;

	}

	return Query;

}



module.exports = {
	authURL,
	tokenURL,
	queryURL,
	router,
	ACCESS_TOKEN,
	SFQueryParams,
	SFAuthParams,
	SFTokenParams
};