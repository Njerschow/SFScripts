const mongoose = require('mongoose');
const path = require('path');
require('./db');
const express = require('express');
const bodyParser = require('body-parser');
const ImagePost = mongoose.model('ImagePost');
const Image = mongoose.model('Image');

const app = express();

app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: false }));

const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.get('/image-posts/:slug', function(req, res) {
	const searchObj = {'slug':req.params.slug};
	ImagePost.findOne(searchObj, function(err, imagepost, count) {
		res.render('specpost', {'imageposts':imagepost});
	});
	
});

app.post('/image-posts-add/:slug', function(req, res) {
	const searchObj = {'slug':req.params.slug};
	if (req.body.ip1cap!=='' && req.body.ip1url!=='') {
		ImagePost.findOneAndUpdate(searchObj, {$push: {images: {'caption':req.body.ip1cap, 'url':req.body.ip1url}}}, function(err, imagepost, count) {
			if (err) {console.log(err);}
			else {res.redirect('/image-posts/'+req.params.slug);}
		});
	}
});

app.post('/image-posts-rm/:slug', function(req,res) {
	const searchObj = {'slug':req.params.slug};
	ImagePost.findOne(searchObj, function(err, imagepost, count) {
		if (err) {console.log(err);}
		else {
			let ids = [];
			if(!Array.isArray(req.body.id)) {
				ids = [req.body.id];
			} else {
				ids = req.body.id;
			}
			imagepost.images=imagepost.images.filter(function(ele) {
				for (let i = 0; i<ids.length;i++) {
					if(ele._id==ids[i]) {
						return false;
					}
				}
				return true;
			});
			imagepost.save((err) => {
				if(err) {console.log(err);}
				else {res.redirect('/image-posts/'+req.params.slug);}
			});
		}
	});
});

let emptyTitle = false;

app.get('/image-posts', function(req,res) {
	ImagePost.find({}, function(err, imageposts, count) {
		res.render('image-posts', {'imageposts':imageposts, 'emptytitle':emptyTitle});
	});
});

app.post('/image-posts-add', function(req,res) {
	if(req.body.iptitle===undefined || req.body.iptitle==='') {
		emptyTitle=true;
		res.redirect('/image-posts');
		return;
	}
	emptyTitle=false;
	const newImagePost = new ImagePost({'title':req.body.iptitle});
	//check for empty and add to array
	for(let i = 1; i <= 3; i++) { 
		if (req.body["ip"+i+"url"]!=='' && req.body["ip"+i+"cap"]!=='') {
			newImagePost.images.push(new Image({'caption':req.body["ip"+i+"cap"],'url':req.body["ip"+i+"url"]}));
		}
	}
	//save database element
	newImagePost.save((err) => {
		if (err) {console.log(err);}
		else {res.redirect('/image-posts');}
	});
	//redirect to page
	
});

app.listen(3000);

