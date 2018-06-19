const config = module.exports;
const cf = require('config');
const url = require('url');
require('dotenv').config();

config.express = {
  port: cf.express.PORT || 3000,
  host: cf.express.HOST || '127.0.0.1'
};

config.salesforce = cf.get('salesforce');

config.salesforce.authParams.client_id = process.env.CLIENT_ID;
config.salesforce.tokenParams.client_id = process.env.CLIENT_ID;
config.salesforce.tokenParams.client_secret = process.env.CLIENT_SECRET;

config.salesforce.authURL = url.parse(config.salesforce.oauth2.baseURL+config.salesforce.oauth2.endpoints.auth);
config.salesforce.tokenURL = url.parse(config.salesforce.oauth2.baseURL+config.salesforce.oauth2.endpoints.token);
config.salesforce.queryURL = url.parse(config.salesforce.datacenter.baseURL+config.salesforce.datacenter.endpoints.query);



