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
    fs = require('fs')


  var storage = multer.diskStorage({
  destination: './uploads/users',
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
//Any requests to this controller must pass through this 'use' function
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

//REST operations for users
router.route('/')
    //GET all users
    .get(function(req, res, next) {
        //retrieve all users from DB
        mongoose.model('User').find({}, function (err, users) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.ejs file in the views/users folder. We are also setting "users" to be an accessible variable in our view
                    html: function(){
                        res.render('users/index', {
                              title: 'All Users',
                              users : users,
                              message : req.flash('action')
                          });
                    },
                    //JSON response will show all blobs in JSON format
                    json: function(){
                        res.json(users);
                    }
                });
              }     
        });
    })
    //POST a new user
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
        }).single('image') ,function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.username;
        var role = req.body.role;
        var email = req.body.email;
        var password = req.body.password;
        var image = ("/users/" + req.file.filename) || req.body.image
        //call the create function for our database
        mongoose.model('User').create({
            username : name,
            role : role,
            email : email,
            password : password,
            image: image
        }, function (err, user) {
              if (err) {
                  res.send("There was a problem adding User to the database.");
              } else {
                  //User has been created
                  console.log('POST creating new User: ' + user);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("users");
                        req.flash('action', 'User created!')
                        // And forward to success page
                        res.redirect("/users");
                    },
                    //JSON response will show the newly created user
                    json: function(){
                        res.json(user);
                    }
                });
              }
        })
    });

router.get('/activity', function(req, res) {

    res.render('users/activity', { title: 'Company Activity' });
})

/* GET New User page. */
router.get('/new', function(req, res) {
    
    res.render('users/new', { title: 'Add New User' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('User').findById(id, function (err, user) {
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
            //console.log(user);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('User').findById(req.id, function (err, user) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + user._id);
        res.format({
          html: function(){
              res.render('users/profile', {
                "title": user.username,
                "user" : user
              });
          },
          json: function(){
              res.json(user);
          }
        });
      }
    });
  });

router.route('/:id/edit')
	//GET the individual user by Mongo ID
	.get(function(req, res) {
	    //search for the user within Mongo
	    mongoose.model('User').findById(req.id, function (err, user) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //Return the user 
	            console.log('GET Retrieving ID: ' + user._id);
	            res.format({
	                //HTML response will render the 'edit.ejs' template
	                html: function(){
	                       res.render('users/edit', {
	                          title: 'User' + user._id,
	                          "user" : user 
	                      });
	                 },
	                 //JSON response will return the JSON output
	                json: function(){
	                       res.json(user);
	                 }
	            });
	        }
	    });
	})
	//PUT to update a user by ID
	.put(function(req, res) {

      mongoose.model('User').findOneAndUpdate({_id: req.id}, req.body, {'new': true}, function(err, user) {
        if (err) {
          res.send("There was a problem updating the information to the database: " + err);
        } else {
          //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
          res.format({
              html: function(){
                   res.redirect("/users/" + user._id);
             },
             //JSON responds showing the updated values
            json: function(){
                   res.json(user);
             }
          });
        }
      })
	})
	//DELETE a User by ID
	.delete(function (req, res){

      mongoose.model('User').findOneAndRemove({_id: req.id}, function(err, user) {
        if (err) {
            return console.error(err);
        } else {
            fs.unlinkSync(process.cwd() + '/uploads' + user.image)
            //Returning success messages saying it was deleted
            console.log('DELETE removing ID: ' + user._id);
            req.flash('action', 'User deleted!')
            res.format({
              //HTML returns us back to the main page, or you can create a success page
              html: function(){
                    res.redirect("/users");
              },
               //JSON returns the item with the message that is has been deleted
              json: function(){
                     res.json({message : 'deleted',
                         item : user
                     });
               }
            });
        }
      })
	});

module.exports = router;