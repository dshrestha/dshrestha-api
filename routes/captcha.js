var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');

router.get('/', function (req, res, next) {
    var text = svgCaptcha.randomText();
    var captcha = svgCaptcha({text: text, height: 39});
    req.session.captcha = text;

    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(captcha);
});

router.get('/verify', function (req, res, next) {
    var text = req.query.text;
    var validCaptcha = (text === req.session.captcha);
    req.session.captcha = null;
    res.setHeader('Content-Type', 'application/json');
    if (validCaptcha) {
        res.status(200).send(JSON.stringify({validCaptcha: true}));
    } else {
        res.status(422).send(JSON.stringify({validCaptcha: false}));
    }
});

module.exports = router;
