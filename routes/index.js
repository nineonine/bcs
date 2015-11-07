var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('dashboard', { title: 'BCS' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'BCS' });
})

router.get('/about', function(req, res, next) {
  res.render('about', { title: 'BCS' });
});

router.get('/docs', function(req, res, next) {
  res.render('docs', { title: 'BCS' });
})

module.exports = router;
