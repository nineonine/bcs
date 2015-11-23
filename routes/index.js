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

		// helper function for unfolding the unix date into approximate 13 month borders
		var getUNIXmonths = function(unixdate) {
			var ary = [];
			var date = unixdate
			for(i=0; i<13; i++) {
				ary.push(date)
				date -= 1000 * 60 * 60 * 24 * 30
			}
			return ary.reverse()
		} 

		//helper for returning last element of array
		var last = function(c) {
			return c.slice(-1)[0] 
		}

		// filterReduce abstraction
		var reduceTotal = function(collection, start, end) {

			return collection
				.filter( function(el) {
					return el.status === 'completed' && 
						Date.parse(el.statusHistory.completed) >= start &&
						Date.parse(el.statusHistory.completed) < end 
				})
				.reduce( function(acc, a) {
					return acc + a.total
				}, 0).toFixed(2)
		}

		var theOnewhichBelongsTo = function(type, name, collection) {

			var customer = collection.filter(function(el) {
				return el.name == name
			})[0]

			return customer.type === type
		}

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
		}, function(err, resultObj) { // resultObj --> {customers, orders}
			if(err) {
				console.log(err)
			} else {
				
				// prepare stats
				var endUserOrders = resultObj.orders.filter(function(o) {
					var name = o.customer
					return theOnewhichBelongsTo('End User', name, resultObj.customers )	
				})
				var homeUserOrders = resultObj.orders.filter(function(o) {
					var name = o.customer
					return theOnewhichBelongsTo('Home User', name, resultObj.customers )	
				})
				var companyOrders = resultObj.orders.filter(function(o) {
					var name = o.customer
					return theOnewhichBelongsTo('Company', name, resultObj.customers )	
				})

				var endUsersQty = resultObj.customers.filter( function(el) {
					return el.type === 'End User'
				}).length
				var homeUsersQty = resultObj.customers.filter( function(el) {
					return el.type === 'Home User'
				}).length
				var companiesQty = resultObj.customers.filter( function(el) {
					return el.type === 'Company'
				}).length

				// get qty of customers
				var totalCusts = resultObj.customers.length

				// get new customers for specified period of time
				var newCusts = resultObj.customers.filter( function(c) {
						return Date.parse(c.registered) >= startDate && Date.parse(c.registered) < endDate
					}).length

				// get total amt of sales of sp p of time
				var periodSales = reduceTotal(resultObj.orders, startDate, endDate)

				// get lifetime sales	
				var allTimeSales = resultObj.orders
					.filter( function(e) {
						return e.status === 'completed'
					})
					.reduce( function(acc, a) {
						return acc + a.total
					}, 0).toFixed(2)

				// get end user sales for 12 months	
				var endUserMonthlySales = getUNIXmonths(endDate).reduce(function(acc, el, index, array) {
					var reducedValue
					// if acc is not empty
					if (index === 12) {
						return acc
					// its a first value of collection	
					} else {
						reducedValue = reduceTotal(endUserOrders, el, array[index+1])
						acc.push(reducedValue)
						return acc
					}
				}, [])

				var homeUserMonthlySales = getUNIXmonths(endDate).reduce(function(acc, el, index, array) {
					var reducedValue
					// if acc is not empty
					if (index === 12) {
						return acc
					// its a first value of collection	
					} else {
						reducedValue = reduceTotal(homeUserOrders, el, array[index+1])
						acc.push(reducedValue)
						return acc
					}
				}, [])

				var companyMonthlySales = getUNIXmonths(endDate).reduce(function(acc, el, index, array) {
					var reducedValue
					// if acc is not empty
					if (index === 12) {
						return acc
					// its a first value of collection	
					} else {
						reducedValue = reduceTotal(companyOrders, el, array[index+1])
						acc.push(reducedValue)
						return acc
					}
				}, [])

				var stats = {
					totalCustomers: totalCusts,
					newCustomers: newCusts,
					periodSales: periodSales,
					allTimeSales: allTimeSales,
					salesChartData: {
						endUserData: endUserMonthlySales,
						homeUserData: homeUserMonthlySales,
						companyData: companyMonthlySales
					},
					customerTypesData: {
						endUsersQty: endUsersQty,
						homeUsersQty: homeUsersQty,
						companiesQty: companiesQty
					}
				}

				console.log(stats)
				//send response back
				res.json(stats)

			}
		})

	})


	return router
}

