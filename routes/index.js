var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
