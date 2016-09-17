var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

router.post('/', function (request, res, next) {
    var auth = {
        auth: {
            api_key: process.env['MAILGUN-API-KEY'] ,
            domain: process.env['MAILGUN-DOMAIN']
        }
    };
    var transporter = nodemailer.createTransport(mg(auth));
    var from = request.body.from;
    var to = request.body.to;
    var subject = request.body.subject;
    var message = request.body.message;

    transporter.sendMail({
        from: from,
        to: to,
        subject: subject,
        text: message
    }, function (err, info) {
        if (err) {
            res.status(500).send(JSON.stringify({message: err}));
        } else {
            res.status(200).send(JSON.stringify({message: "Email sent successfully"}));
        }
    });
});

module.exports = router;
