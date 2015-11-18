var express = require('express');
var router = express.Router();
var flash = require('connect-flash')

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login');
}

module.exports = function(passport){

	router.use(flash());


	/* GET home page. */
	router.get('/', isAuthenticated, function(req, res, next) {
	  res.render('dashboard', { 
	  	title: 'BCS',
	  	"user" : req.user 
	  });
	});

	router.get('/login', function(req, res, next) {
	  res.render('login', { 
	  	title: 'BCS',
	  	message : req.flash('message') 
	  });
	})

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash : true  
	}));

	router.get('/about', function(req, res, next) {
	  res.render('about', { title: 'BCS' });
	});

	router.get('/docs', isAuthenticated, function(req, res, next) {
	  res.render('docs', { title: 'BCS', user: req.user });
	})


	/* Handle Logout */
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/login');
	});


	return router
}

