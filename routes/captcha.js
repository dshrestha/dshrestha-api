const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

router.get('/', function (req, res, next) {
    let captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(captcha.data);
});

router.get('/verify', function (req, res, next) {
    let text = req.query.text;
    let validCaptcha = (text === req.session.captcha);
    
    req.session.captcha = null;
    res.setHeader('Content-Type', 'application/json');
    if (validCaptcha) {
        res.status(200).send(JSON.stringify({validCaptcha: true}));
    } else {
        res.status(422).send(JSON.stringify({validCaptcha: false}));
    }
});

module.exports = router;
