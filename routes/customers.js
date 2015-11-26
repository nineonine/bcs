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
    s3 = require('multer-storage-s3'),
    activity = require('../model/activities')

module.exports = function(passport) {

    var storage = s3({
      destination : function( req, file, cb ) {  
          cb( null, 'customers' );
      },
      filename : function( req, file, cb ) {
          cb( null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      },
      bucket      : 'bcs-store-assets',
      region      : 'us-west-2'
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

  //REST operations for customers
  router.route('/')
      //GET all customers
      .get(function(req, res, next) {
          //retrieve all customers from DB
          mongoose.model('Customer').find({}, function (err, customers) {
                if (err) {
                    return console.error(err);
                } else {
                    res.format({
                      html: function(){
                          res.render('customers/index', {
                                title: 'All customers',
                                customers : customers,
                                message : req.flash('action'),
                                user: req.user
                            });
                      },
                      //JSON response will show all blobs in JSON format
                      json: function(){
                          res.json(customers);
                      }
                  });
                }     
          });
      })
      //POST a new Customer
      .post(multer({ 
          fileFilter: function(req, file, cb) {
              if (path.extname(file.originalname) !== '.jpg' 
                && path.extname(file.originalname) !== '.png'
                && path.extname(file.originalname) !== '.jpeg') {
                return cb(new Error('Only jpg, jpeg and png files are allowed'))
              }
              cb(null, true)
          },
          storage: storage
          }).single('image'),function(req, res) {
            
            var name = req.body.name;
            var type = req.body.type;
            var email = req.body.email;
            var reg = new Date()
            var image = req.file ? req.file.s3.Location : "https://bcs-store-assets.s3-us-west-2.amazonaws.com/placeholder.png";
            var discount = req.body.discount;
            var contactNumber = req.body.contactNumber;
            var additionalInfo = req.body.additionalInfo;

            var billingAddress = {
                 address: req.body.billAddress,
                 city: req.body.billcity,
                 state: req.body.billstate,
                 zip: req.body.billzip 
            }

            var shippingAddress = {
                address: req.body.shipAddress,
                city: req.body.shipcity,
                state: req.body.shipstate,
                zip: req.body.shipzip
            }

            mongoose.model('Customer').create({
                name : name,
                type : type,
                image : image,
                email : email,
                registered : reg,
                discount : discount,
                contactNumber: contactNumber,
                additionalInfo: additionalInfo,
                billing: shippingAddress,
                shipping: shippingAddress
            }, function (err, customer) {
                  if (err) {
                      res.send("There was a problem adding Customer to the database.");
                  } else {
                      //Customer has been created
                      console.log('POST creating new Customer: ' + customer);
                      res.format({
                        html: function(){
                            // If it worked, set the header so the address bar doesn't still say /addCustomer
                            res.location("customers");
                            // And forward to success page
                            req.flash('action', 'Customer created!')
                            res.redirect("/customers");
                        },
                        //JSON response will show the newly created Customer
                        json: function(){
                            res.json(customer);
                        }
                    });
                  }
            })
      });

  /* GET New Customer page. */
  router.get('/new', function(req, res) {
      res.render('customers/new', { title: 'Add New Customer', user: req.user });
  });

  // route middleware to validate :id
  router.param('id', function(req, res, next, id) {
      console.log('validating ' + id + ' exists');
      //find the ID in the Database
      mongoose.model('Customer').findById(id, function (err, customer) {
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
              console.log(customer);
              // once validation is done save the new item in the req
              req.id = id;
              // go to the next thing
              next(); 
          } 
      });
  });

  router.route('/:id')
    .get(function(req, res) {

      async.waterfall([
        function(done) {
            mongoose.model('Customer').findById(req.id, function (err, customer) {
              if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return done(err)
              } else {
                done(null, customer)
              }
            })
        },
        function(customer, done) {
            mongoose.model('Order').find({'customer': customer.name}, function(err, orders) {
              if(err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
                return done(err)
              } else {
                  res.format({
                    html: function(){
                        res.render('customers/profile', {
                          "customer" : customer,
                          "title" : customer.name,
                          "orders": orders,
                          "user": req.user
                        });
                    },
                    json: function(){
                        res.json(customer);
                    }
                  });
              }
            })
        }   
      ])

    });
  
  router.post('/:id/comment', function(req, res) {

    var postedOn = new Date()

    mongoose.model('Customer').findByIdAndUpdate(
      req.id,
      { $push: {'comments': {authorID: req.body.author, 
        authorAvatar: req.user.image,
        authorName: req.user.username, 
        text: req.body.text, 
        posted: postedOn} 
      } },
      {safe: true, upsert: true, 'new': true}, function(err, customer) {
          if(err) {
            console.log('GET Error: There was a problem adding comment to Customer: ' + err);
          } else {

            activity.register('addNote', req.user, null, customer)

            res.json({
              authorID: req.body.author,
              authorAvatar: req.user.image,
              authorName: req.user.username,
              text: req.body.text,
              posted: postedOn
            })
          }
      })
  })

  router.route('/:id/edit')
  	//GET the individual customer by Mongo ID
  	.get(function(req, res) {
  	    //search for the customer within Mongo
  	    mongoose.model('Customer').findById(req.id, function (err, customer) {
  	        if (err) {
  	            console.log('GET Error: There was a problem retrieving: ' + err);
  	        } else {
  	            //Return the Customer 
  	            console.log('GET Retrieving ID: ' + customer._id);
  	            res.format({
  	                //HTML response will render the 'edit.ejs' template
  	                html: function(){
  	                       res.render('customers/edit', {
  	                          title: 'Customer' + customer._id,
  	                          "customer" : customer,
                              "user" : req.user
  	                      });
  	                 },
  	                 //JSON response will return the JSON output
  	                json: function(){
  	                       res.json(customer);
  	                 }
  	            });
  	        }
  	    });
  	})
  	//PUT to update a Customer by ID
  	.put(function(req, res) {
        mongoose.model('Customer').findOneAndUpdate({_id: req.id}, req.body
        , {'new': true}, function(err, customer) {
          if (err) {
            res.send("There was a problem updating the information to the database: " + err);
          } else {
            //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
            res.format({
                html: function(){
                     res.redirect("/customers/" + customer._id);
               },
               //JSON responds showing the updated values
              json: function(){
                     res.json(customer);
               }
            });
          }
        })
  	})
  	//DELETE a Customer by ID
  	.delete(function (req, res){

        mongoose.model('Customer').findOneAndRemove({_id: req.id}, function(err, customer) {
          if (err) {
              return console.error(err);
          } else {

            //Returning success messages saying it was deleted
            console.log('DELETE removing ID: ' + customer._id);
            req.flash('action', 'Customer deleted!')
            res.format({
              //HTML returns us back to the main page, or you can create a success page
                html: function(){
                    res.redirect("/customers");
                },
               //JSON returns the item with the message that is has been deleted
                json: function(){
                    res.json({message : 'deleted',
                        item : customer
                    });
                }
            });
          }
        })
  	});

  return router

}  