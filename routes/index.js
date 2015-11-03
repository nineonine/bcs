var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BCS' });
});

router.get('/about', function(req, res, next) {
  res.render('about', { title: 'BCS' });
});

module.exports = router;
