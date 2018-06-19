var express = require('express');

var app = express();



module.exports = function(options) {
	SiteRouter = require('./site/router.js');
	siteRouter = new SiteRouter(options);

	app.use('/sf', require('./salesforce/router.js')(options));
	app.use(siteRouter.router);

	return app;
}