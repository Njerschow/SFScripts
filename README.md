# SFScripts

This script uses the path, express, request, and body-parser modules to submit an arbitrary query to the SalesForce API.

USAGE:
To run script run npm install (if necessary) and then run node app.js.

Once the script is running go to your browser and connect to http://localhost:3000/.

Once you make it through the first couple of pages, you will see two seperate forms. On one form you can type in a raw SOQL (very similar to SQL) query, and on the other you can type in a phrase from the Salesforce AVMs file along with a client name. 

some examples are:

Query: SELECT Name FROM Account



Phrase: What were sales for X last year?

Client: United Oil & Gas, Singapore
