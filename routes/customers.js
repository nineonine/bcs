var express = require('express'),
    multer = require('multer'),
    path = require('path'),
    crypto = require('crypto'),
    router = express.Router(),
    mongoose = require('mongoose'), 
    bodyParser = require('body-parser'), 
    methodOverride = require('method-override');

var storage = multer.diskStorage({
  destination: './uploads/customers',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)

      cb(null, raw.toString('hex') + path.extname(file.originalname))
    })
  }
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
                              "customers" : customers
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
          // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
          var name = req.body.name;
          var type = req.body.type;
          var email = req.body.email;
          var image = "/customers/" + req.file.filename 
          var discount = req.body.discount;
          var contactNumber = req.body.contactNumber;
          var additionalInfo = req.body.additionalInfo;
          var billingAddress = req.body.billingAddress;
          var shippingAddress = req.body.shippingAddress;
          
          mongoose.model('Customer').create({
              name : name,
              type : type,
              image : image,
              email : email,
              discount : discount,
              contactNumber: contactNumber,
              additionalInfo: additionalInfo,
              billingAddress: billingAddress,
              shippingAddress: shippingAddress  
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
    res.render('customers/new', { title: 'Add New Customer' });
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
            //console.log(customer);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Customer').findById(req.id, function (err, customer) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + customer._id);
        res.format({
          html: function(){
              res.render('customers/profile', {
                "customer" : customer,
                "title" : customer.name
              });
          },
          json: function(){
              res.json(customer);
          }
        });
      }
    });
  });

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
	                          "customer" : customer 
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

      mongoose.model('Customer').findOneAndUpdate({_id: req.id}, req.body, {'new': true}, function(err, customer) {
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

module.exports = router;