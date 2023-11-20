var express = require('express');
var router = express.Router();

const gpus = {}
router.post('/', function(req, res, next) {
  if (req.body.hostname != undefined) {
    req.body.ip = req.ip
    gpus[req.body.hostname] = req.body
  }
  res.sendStatus(200)
});

router.get('/', function(req, res, next) {
  res.json(gpus)
});
module.exports = router;
