var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), 
    bodyParser = require('body-parser'), 
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    flash = require('connect-flash')


module.exports = function(passport) {

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

    router.get('/', function(req, res) {

        var today = Date.parse(new Date()) // unix timestamp

        // get activities for last day
        mongoose.model('Activity').find({
           "date": {'$gte': new Date(today - 1000 * 60 * 60 * 24)} 
        }, function(err, activities) {

            if (err) {
                return console.log(err)
            } else {
                res.format({

                    html: function() {
                        res.render('activities/index', {
                            title: 'Company Activity',
                            activities: activities.reverse(),
                            user: req.user
                        })
                    },

                    json: function() {
                        res.json(activities)
                    } 
                }) 
            }
        })
    })

    return router
}
