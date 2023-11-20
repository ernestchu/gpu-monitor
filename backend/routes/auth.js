require('dotenv').config()
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  if (req.body.user == process.env.AUTH_USER &&
      req.body.password == process.env.AUTH_PASS) {

      res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
});

module.exports = router;

