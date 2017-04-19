var AlipayF2F = require("../..");
var ExampleConfig = require("../../express-example/config.js");

module.exports = {};

before(function(){
  module.exports.alipay_f2f = new AlipayF2F(ExampleConfig);
})
