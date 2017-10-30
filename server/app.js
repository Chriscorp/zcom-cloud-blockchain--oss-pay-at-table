const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    debug = require('debug')('server');

app.listen(3000);

app.use('/pay-at-table/', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    if (res.headersSent) return next();
    debug('err', 'NOT FOUND');
    res.status(404).send({ result: 'not found' });
    next();
});

app.use(function(err, req, res, next) {
    debug('err', err);
    if (!res.headersSent) res.status(500).send({ result: 'failure' });
});
