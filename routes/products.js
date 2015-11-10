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
    fs = require('fs'),
    flash = require('connect-flash')

var storage = multer.diskStorage({
  destination: './uploads/products',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)

      cb(null, raw.toString('hex') + path.extname(file.originalname))
    })
  }
}) 

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

//REST operations for products
//GET all products
router.route('/')
  .get(function(req, res, next) {
        //retrieve all products from DB
      mongoose.model('Product').find({}, function (err, products) {
            if (err) {
                return console.error(err);
            } else {
                res.format({
                  html: function(){
                      res.render('products/index', {
                            title: 'All products',
                            "products" : products,
                            message : req.flash('action')
                        });
                  },
                  //JSON response will show all blobs in JSON format
                  json: function(){
                      res.json(products);
                  }
              });
            }     
      });
})
    //POST a new Product
.post( multer({ 
  fileFilter: function(req, file, cb) {
      if (path.extname(file.originalname) !== '.jpg' 
        && path.extname(file.originalname) !== '.png'
        && path.extname(file.originalname) !== '.jpeg') {
        return cb(new Error('Only jpg, jpeg and png files are allowed'))
      }
      cb(null, true)
  },
  storage: storage
  }).single('image'), function(req, res) {
    // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
    var name = req.body.name;
    var sku = req.body.sku;
    var price = req.body.price;
    var qty = req.body.qty;
    var description = req.body.description;
    var image = "/products/" + req.file.filename 
    var status = req.body.status;

    //console.log(req.file)
    
    mongoose.model('Product').create({
        name : name,
        sku : sku,
        price : price,
        qty : qty,
        description: description,
        image: image,
        status: status
    }, function (err, product) {
          if (err) {
              res.send("There was a problem adding Product to the database.");
          } else {
              //Product has been created
              console.log('POST creating new Product: ' + product);
              res.format({
                html: function(){
                    res.location("products");
                    res.redirect("/products");
                },
                json: function(){
                    res.json(product);
                }
            });
          }
    })
});    


/* GET New Product page. */
router.get('/new', function(req, res) {
    res.render('products/new', { 
      title: 'Add New Product',
      action: 'new'
      });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Product').findById(id, function (err, product) {
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
            //console.log(product);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Product').findById(req.id, function (err, product) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + product._id);
        res.format({
          html: function(){
              res.render('products/show', {
                "Product" : product
              });
          },
          json: function(){
              res.json(product);
          }
        });
      }
    });
  });

router.route('/:id/edit')
	//GET the individual Product by Mongo ID
	.get(function(req, res) {
	    //search for the Product within Mongo
	    mongoose.model('Product').findById(req.id, function (err, product) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //Return the Product 
	            console.log('GET Retrieving ID: ' + product._id);
	            res.format({
	                //HTML response will render the 'edit.ejs' template
	                html: function(){
	                       res.render('products/product', {
	                          title: 'product' + product._id,
	                          "product" : product,
                            action: 'edit' 
	                      });
	                 },
	                 //JSON response will return the JSON output
	                json: function(){
	                       res.json(product);
	                 }
	            });
	        }
	    });
	})
	//PUT to update a Product by ID
	.put(function(req, res) {

      mongoose.model('Product').findOneAndUpdate({_id: req.id}, req.body, {'new': true}, function(err, product) {
        if (err) {
          res.send("There was a problem updating the information to the database: " + err);
        } else {
          //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
          res.format({
              html: function(){
                   res.redirect("/products/" + product._id);
             },
             //JSON responds showing the updated values
            json: function(){
                   res.json(product);
             }
          });
        }
      })
	})
	//DELETE a Product by ID
	.delete(function (req, res){

      mongoose.model('Product').findOneAndRemove({_id: req.id}, function(err, product) {
        if (err) {
            return console.error(err);
        } else {
            //Removing image
            fs.unlinkSync(process.cwd() + '/uploads' + product.image)
            //Returning success messages saying it was deleted
            req.flash('action', 'Product deleted!')
            console.log('DELETE removing ID: ' + product._id);
            res.format({
              //HTML returns us back to the main page, or you can create a success page
                html: function(){
                     res.redirect("/products");
               },
               //JSON returns the item with the message that is has been deleted
              json: function(){
                     res.json({message : 'deleted',
                         item : product
                     });
               }
            });
        }
      })
	});

module.exports = router;