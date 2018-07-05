
module.exports = function queryResolve(phrase, X, options) {
	let date = new Date(Date.now());
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth()+1;
	const quarter = Math.ceil(month/3);

	let Query = "";

	let action = options.queryTable[phrase];

	if (!X) {
		X='';
	}

	//Code to get action taken --> action
	switch (action) {
		case "Get first quarter sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=1 and Account.name LIKE '"+X+"'"
		break;
		// case "Get second quarter sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=2 and Account.name LIKE '"+X+"'";
		break;

		case "Get third quarter sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=3 and Account.name LIKE '"+X+"'";
		break;

		case "Get fourth quarter sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter=4 and Account.name LIKE '"+X+"'";
		break;

		case "Get last quarter sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+(quarter===1 ? (year-1) : year)+" and FIscalQuarter="+ (quarter===1 ? 4 : (quarter-1))+" and Account.name LIKE '"+X+"'";
		break;

		case "Get current quarter sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+year+" and FIscalQuarter="+quarter+" and Account.name LIKE '"+X+"'";
		break;

		case "Get last year sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+(year-1)+" and Account.name LIKE '"+X+"'";
		break;

		case "Get current year sales number":
		Query = "SELECT sum(Amount) FROM Opportunity WHERE FiscalYear="+year+" and Account.name LIKE '"+X+"'";
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

		case "Pull the status for the Support Ticket #": // Support tickets not in salesforce -- would need custom field integration
		break;

		case "Pull the status for open / latest Support Ticket PLUS Email": // Support tickets not in salesforce -- would need custom field integration
		break;

		case "Pull the status for the Support Ticket": // Support tickets not in salesforce -- would need custom field integration
		break;

		case "Pull status for open / latest Support Ticket": // Support tickets not in salesforce -- would need custom field integration
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

		case "Get # of seats sold in last sale": //Not sure what is meant by seats -- same as units for now
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
		Query = "Select UnitPrice, Product2.Name From PricebookEntry Where Product2.Name LIKE '"+X+ "'";
		break;

		case "Get pricing on last sale for client":
		Query = "SELECT ExpectedRevenue FROM Opportunity WHERE Account.name LIKE '"+X+"' and StageName LIKE 'Closed Won' ORDER BY CloseDate DESC LIMIT 1";
		break;

		case "Get contact info":
		Query = "SELECT ContactEmail,Contact.Name, ContactPhone, ContactMobile FROM Case WHERE Account.name LIKE '"+X+"'";
		break;

		case "Get renewal date": // not sure
		break;

		case "Get notes":
		Query = "SELECT Description FROM Opportunity Where Account.name LIKE '"+X+"'";
		break;

		case "Get employee number for X":
		Query = "SELECT EmployeeNumber FROM User WHERE Name LIKE '"+X+"'"; 
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
