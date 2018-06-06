const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const url = require('url');
require('dotenv').config();
CONFIG = require('./config.json');
router = require('./router.js');


const port = process.env.PORT || 3000;


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));
app.use('/', router.router);





app.listen(port);
console.log("listening on port 3000");

////////////////////////



