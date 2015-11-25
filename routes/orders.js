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
    async = require('async'),
    nodemailer = require('nodemailer'),
    ejs = require('ejs')


module.exports = function(passport) {

  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'best.communication.store.team@gmail.com',
        pass: 'bcssupport'
    }
  });

  router.use(cookieParser('secret'));
  router.use(session({
    cookie: { maxAge: 60000 },
    secret: 'keyboard-cat',
    resave: true,
    saveUninitialized: true
  }));
  router.use(flash());

  router.use(function (req, res, next) {
    if (req.isAuthenticated())
      return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/login');
  })

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
                                orders : orders.filter( (o) => o.status === 'processing' || o.status === 'shipped' ),
                                message : req.flash('action'),
                                user : req.user
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
          var sales = req.user.username;

          mongoose.model('Order').create({
              orderNumber : orderNumber,
              customer: customer,
              total : total,
              shipping : shipping,
              discount: discount,
              notes: notes,
              sales: sales,
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

  //all active orders sidebar notification
  router.get('/active', function(req, res) {
    mongoose.model('Order').find({
      $or: [
        { status: 'shipped'},
        { status: 'processing'}
      ]
    }, function(err, products) {

        res.json(products.length)

    })
  })

  /* GET New Order page. */
  router.get('/new', function(req, res) {

      res.render('orders/new', { title: 'Add New Order', user : req.user });
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
                            "orders" : orders.filter( (o) => o.status === 'completed' || o.status === 'cancelled' ),
                            user : req.user
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

  // intercept resource id
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
                              products: products,
                              user : req.user 
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
  
  // Send invoice email
  router.get('/:id/email/send', function(req, res) {

    async.waterfall([
      // get order
      function(cb) {
        mongoose.model('Order').findById(req.id, function(err, order) {
          if(err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
            return cb(err)
          } else {
            console.log(order)
            cb(null, order)
          }
        })
      },
      //get customer ( for email and other useful info ) 
      function(order, cb) {
        mongoose.model('Customer').find({'name': order.customer}, function (err, customers) {
          if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
            return cb(err)
          } else {
            console.log(customers[0])
            cb(null, order, customers[0])
          }
        })
      },

      // generate email and send to customer
      function(order, customer, cb) {

        var html = fs.readFileSync(process.cwd() + '/views/emails/invoice.ejs', 'utf-8');
        var letter =  ejs.render(html, {order: order, customer: customer})   

        var mailOptions = {
            from: 'best.communication.store.team@gmail.com', 
            to: customer.email, 
            subject: '(BCS): Hey, '+ customer.name +'! Your invoice #' + order.orderNumber + ' is ready!', 
            text: order.orderNumber, 
            html: letter 
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error) {
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
            res.sendStatus(200)
        });  

      }
    ]);
  })

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
                        title : "Invoice #" + order.orderNumber,
                        user : req.user
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
                        title : "Packing slip #" + order.orderNumber,
                        user : req.user
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

  router.get('/:id/cancel', function(req, res) {
      mongoose.model('Order').findOneAndUpdate({_id: req.id}, { $set: {'status': 'cancelled', 'statusHistory.cancelled': new Date() }}, { 'new': true, 'upsert': true}, function(err, order) {
          if(err) {
            console.log("error cancelling order")
          } else {
            req.flash('action', 'Order '+ order.orderNumber +' Cancelled!')
            res.redirect('/orders')
          }
      })
  })

  router.get('/:id/complete', function(req, res) {

    async.waterfall([
      function(cb) {
        mongoose.model('Order').findOneAndUpdate({_id: req.id}, { $set: {'status': 'completed', 'statusHistory.completed': new Date() }}, { 'new': true, 'upsert': true}, function(err, order) {
          if(err) {
            console.log("error completing order")
          } else {
            cb(null, order)
          }
        })
      },

      // update stock quantity for each product
      function(order, cb) {
        async.map(order.cart, 
          function(el, cb) {
            mongoose.model('Product').findOneAndUpdate({name: el.name}, { $inc: {qty: (-1)*el.quantity} }, { 'new': true, 'upsert': true}, function(err, p) {
              if(err) {
                console.log("error updating product qty")
                return cb(err)
              } else { 
                return cb(null, p)
              }
            })
          },
          function(err, results) {

            req.flash('action', 'Order '+ order.orderNumber +' Completed!')
            res.redirect('/orders')
          }
        )
      }
    ])
  })

  router.get('/:id/ship', function(req, res) {
      mongoose.model('Order').findOneAndUpdate({_id: req.id}, { $set: {'status': 'shipped', 'statusHistory.shipped': new Date() }}, { 'new': true, 'upsert': true}, function(err, order) {
          if(err) {
            console.log("error shipping order")
          } else {
            req.flash('action', 'Order '+ order.orderNumber +' marked shipped!')
            res.redirect('/orders')
          }
      })
  })

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
  	                          "order" : order,
                              user : req.user 
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

  return router;
}