var express = require('express');
var path = require('path');

function checkToken(req,res,next) {
	if (!this.access_token && !(/^\/sf\/auth\/?/.test(req.path))) {
		res.redirect('/sf/auth');
	} 
	next();
}

function home(req, res) {
	res.sendFile(path.join(__dirname + './../../public/query.html'));
}


class SiteRouter {
	constructor(options) {
		this.options = options;

		this.router = new express.Router();

		this.router.use(checkToken.bind(options));

		this.router.get('/', home.bind(options));
	}
}

module.exports = SiteRouter;