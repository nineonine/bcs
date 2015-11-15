var express = require('express'),
    multer = require('multer'),
    path = require('path'),
    crypto = require('crypto'),
    router = express.Router(),
    mongoose = require('mongoose'), 
    bodyParser = require('body-parser'), 
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    flash = require('connect-flash'),
    fs = require('fs'),
    async = require('async')

router.use(cookieParser('secret'));
router.use(session({
  cookie: { maxAge: 60000 },
  secret: 'keyboard-cat',
  resave: true,
  saveUninitialized: true
}));
router.use(flash());

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

//REST operations for orders
router.route('/')
    //GET all orders
    .get(function(req, res, next) {
        //retrieve all orders from DB
        mongoose.model('Order').find({}, function (err, orders) {
              if (err) {
                  return console.error(err);
              } else {
                  res.format({
                    html: function(){
                        res.render('orders/index', {
                              title: 'All orders',
                              orders : orders,
                              message : req.flash('action')
                          });
                    },
                    //JSON response will show all blobs in JSON format
                    json: function(){
                        res.json(orders);
                    }
                });
              }     
        });
    })
    //POST a new Order
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var orderNumber = req.body.orderNumber;
        var customer = req.body.customer;
        var total = req.body.total;
        var shipping = req.body.shipping;
        var discount = req.body.discount;
        var notes = req.body.notes;
        var cart = req.body.cart;


        mongoose.model('Order').create({
            orderNumber : orderNumber,
            customer: customer,
            total : total,
            shipping : shipping,
            discount: discount,
            notes: notes,
            status : 'processing',
            cart: cart,
            statusHistory: {
                processing: new Date()
            }
        }, function (err, order) {
              if (err) {
                  console.log(err)
                  res.send("There was a problem adding Order to the database.");
              } else {
                  //Order has been created
                  console.log('POST creating new Order: ' + order);
                  res.format({
                    html: function(){
                        res.location("orders");
                        res.redirect("/orders");
                    },
                    //JSON response will show the newly created Order
                    json: function(){
                        res.json({
                          order: order,
                          redirect: '/orders'
                        });
                    }
                });
              }
        })
    });

/* GET New Order page. */
router.get('/new', function(req, res) {
    res.render('orders/new', { title: 'Add New Order' });
});

router.get('/history', function(req, res) {
    //retrieve all orders from DB
    mongoose.model('Order').find({}, function (err, orders) {
          if (err) {
              return console.error(err);
          } else {
              res.format({
                html: function(){
                    res.render('orders/history', {
                          title: 'Orders History',
                          "orders" : orders
                      });
                },
                //JSON response will show all blobs in JSON format
                json: function(){
                    res.json(orders);
                }
            });
          }     
    });
})

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Order').findById(id, function (err, order) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(Order);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {

    mongoose.model('Order').findById(req.id, function (err, order) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        
        //get Orders products 
        async.map(order.cart, function(p, done) {
          mongoose.model('Product').find({'name': p.name}, function(err, prod) {
            if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return done(err)
            } else {
              done(null, prod[0])
            }
          });
        }, function(err, products) {
            if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
              console.log(products)
              res.format({
                   //HTML response will render the 'edit.ejs' template
                  html: function(){
                         res.render('orders/order', {
                            title: 'Order' + order.orderNumber,
                            order : order,
                            products: products 
                        });
                   },
                   //JSON response will return the JSON output
                  json: function(){
                         res.json(order);
                   }
              });
            }
        })
      }      
    })
  });

router.get('/:id/invoice', function(req, res) {

  async.waterfall([
    //get order
    function(cb) {
      mongoose.model('Order').findById(req.id, function (err, order) {
        if (err) {
          console.log('GET Error: There was a problem retrieving: ' + err);
          return cb(err)
        } else {
          cb(null, order)
        }
      })
    },
    //get customer
    function(order, cb) {
      mongoose.model('Customer').find({'name': order.customer}, function (err, customers) {
        if (err) {
          console.log('GET Error: There was a problem retrieving: ' + err);
          return cb(err)
        } else {
          cb(null, order, customers)
        }
      })
    },
    //get products
    function(order, customers, cb) {
      async.map(order.cart, function(p, done) {
          mongoose.model('Product').find({'name': p.name}, function(err, prod) {
            if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return done(err)
            } else {
              done(null, prod[0])
            }
          });
        }, function(err, products) {
            if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return cb(err)
            } else {
              res.format({
                html: function(){
                    res.render('orders/invoice', {
                      order : order,
                      customer: customers[0],
                      products: products,
                      title : "Invoice #" + order.orderNumber
                    })
                },
                json: function(){
                  res.json({
                    order: order,
                    customer: customers[0]
                  })
                }
              })
            }
        }
      )

    }])
    // end of async call
});  

router.get('/:id/slip', function(req, res) {

  async.waterfall([
    //get order
    function(cb) {
      mongoose.model('Order').findById(req.id, function (err, order) {
        if (err) {
          console.log('GET Error: There was a problem retrieving: ' + err);
          return cb(err)
        } else {
          cb(null, order)
        }
      })
    },
    //get customer
    function(order, cb) {
      mongoose.model('Customer').find({'name': order.customer}, function (err, customers) {
        if (err) {
          console.log('GET Error: There was a problem retrieving: ' + err);
          return cb(err)
        } else {
          cb(null, order, customers)
        }
      })
    },
    //get products
    function(order, customers, cb) {
      async.map(order.cart, function(p, done) {
          mongoose.model('Product').find({'name': p.name}, function(err, prod) {
            if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return done(err)
            } else {
              done(null, prod[0])
            }
          });
        }, function(err, products) {
            if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return cb(err)
            } else {
              res.format({
                html: function(){
                    res.render('orders/slip', {
                      order : order,
                      customer: customers[0],
                      products: products,
                      title : "Packing slip #" + order.orderNumber
                    })
                },
                json: function(){
                  res.json({
                    order: order,
                    customer: customers[0]
                  })
                }
              })
            }
        }
      )

    }])
    // end of async call
});  



router.route('/:id/edit')
	//GET the individual Order by Mongo ID
	.get(function(req, res) {
	    //search for the Order within Mongo
	    mongoose.model('Order').findById(req.id, function (err, order) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //Return the Order 
	            console.log('GET Retrieving ID: ' + order._id);
	            res.format({
	                //HTML response will render the 'edit.ejs' template
	                html: function(){
	                       res.render('orders/edit', {
	                          title: 'Order' + order._id,
	                          "order" : order 
	                      });
	                 },
	                 //JSON response will return the JSON output
	                json: function(){
	                       res.json(order);
	                 }
	            });
	        }
	    });
	})
	//PUT to update a Order by ID
	.put(function(req, res) {

      mongoose.model('Order').findOneAndUpdate({_id: req.id}, req.body, { 'new': true, 'upsert': true}, function(err, order) {
        if (err) {
          res.send("There was a problem updating the information to the database: " + err);
        } else {
          //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
          res.format({
              html: function(){
                   res.redirect("/orders/" + order._id);
             },
             //JSON responds showing the updated values
              json: function(){
                   res.json(order);
             }
          });
        }
      })
	})
	//DELETE a Order by ID
	.delete(function (req, res){

      mongoose.model('Order').findOneAndRemove({_id: req.id}, function(err, order) {
        if (err) {
            return console.error(err);
        } else {
            req.flash('action', 'Order deleted!')
            //Returning success messages saying it was deleted
            console.log('DELETE removing ID: ' + order._id);
            res.format({
              //HTML returns us back to the main page, or you can create a success page
                html: function(){
                     res.redirect("/orders");
               },
               //JSON returns the item with the message that is has been deleted
              json: function(){
                     res.json({message : 'deleted',
                         item : order
                     });
               }
            });
        }
      })
	});

module.exports = router;