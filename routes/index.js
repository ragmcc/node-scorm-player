var express = require('express');
var router = express.Router();

var path = require('path');
var common = require('../classes/common');

/* GET home page. */
router.get('/', function(req, res, next) {
  var packages = common.getDirectories(path.resolve(__dirname + '/../scorm/packages/'));

  console.log(packages);

  res.render('index', {
    title: 'Node scorm player',
    packages: packages
  });
});

module.exports = router;