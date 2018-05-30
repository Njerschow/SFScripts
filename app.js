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
	//q             : "SELECT Amount, Account.name FROM Opportunity WHERE FiscalYear=2015 and FIscalQuarter=1 and Account.name LIKE 'United Oil & Gas Corp
	q : "SELECT Name, Amount, CloseDate, TotalOpportunityQuantity, ForecastCategoryName, StageName FROM Opportunity",
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
			res.sendFile(path.join(__dirname+'/public/query.html'));
		} else {
			res.send("Error: most likely redirect_uri mismatch between querystring parameters and connected app.")
		}
	});
});



queryCallback = function(res, error, response, body) {
	if (!error && response.statusCode == 200) {
		res.send("Query: "+SFQueryParams.q+"<br> <br> <br>"+body);
	}
}

app.get('/query', function(req, res) {
	if (!ACCESS_TOKEN) {
		SFQueryParams.q = req.query.query;
		res.redirect('/');
	}
	
	sendQuery(req.query.query, queryCallback.bind(this, res));
});

app.get('/phrase', function(req,res) {
	SFQueryParams.q = resolveQuery(req.query.phrase, req.query.client);
	console.log(SFQueryParams.q)
	if (!ACCESS_TOKEN) {
		res.redirect('/');
	}
	
	sendQuery(SFQueryParams.q, queryCallback.bind(this, res));
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

/* NOTES:
For last sale number/UNITS with client, Think about changing from the Opportunity table to the Case table since it has a Close date and a link to Asset
*/

main();

