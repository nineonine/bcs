var express = require('express');
var router = express.Router();
var flash = require('connect-flash')
var async = require('async')
var mongoose = require('mongoose')

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

	// Total customers, New customers, sales this month , Total sales
	router.post('/stats', isAuthenticated, function(req, res) {

		var startDate = req.body.startDate
		var endDate = req.body.endDate

		//fetch customers and orders from DB
		async.parallel({
			customers: function(cb) {
				mongoose.model('Customer').find({}, function(err, cs) {
					if(err) return err

					cb(null, cs)	
				})
			}, 
			orders: function(cb) {
				mongoose.model('Order').find({}, function(err, os) {
					if(err) return err

					cb(null, os)	
				})
			}
		}, function(err, resultObj) {
			if(err) {
				console.log(err)
			} else {
				// prepare stats 

				var totalCusts = resultObj.customers.length

				var newCusts = resultObj.customers.filter( function(c) {
						return Date.parse(c.registered) >= startDate && Date.parse(c.registered) < endDate
					}).length

				var periodSales = resultObj.orders
					.filter( function(o) {
						return o.status === 'completed' && 
						Date.parse(o.statusHistory.completed) >= startDate &&
						Date.parse(o.statusHistory.completed) < endDate
					})
					.reduce( function(acc, a) {
						return acc + a.total
					}, 0).toFixed(2)

				var allTimeSales = resultObj.orders
					.filter( function(e) {
						return e.status === 'completed'
					})
					.reduce( function(acc, a) {
						return acc + a.total
					}, 0).toFixed(2)

				//send response back
				res.json({
					totalCustomers: totalCusts,
					newCustomers: newCusts,
					periodSales: periodSales,
					allTimeSales: allTimeSales
				})

			}
		})

	})


	return router
}

