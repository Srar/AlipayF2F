"use strict";

const app = require('./fixtures/app');
const http = require('http');
const url = require('url');

describe.skip('Token', function(){
  this.timeout(100000);
  let token, query;
  
  // QRCode following url and Alipay sandbox app scan
  // https://openauth.alipaydev.com/oauth2/appToAppAuth.htm?app_id=2016073100134952&redirect_uri=http://192.168.75.69:8080/
  before(function(done){
    http.createServer((req, res) => {
      query = url.parse(req.url, true).query;
      res.end('success');
      done();
    }).listen(8080);
  })
  
  it('should auth ok', function(done){
    const bizContent = {
      grant_type: 'authorization_code',
      code: query.app_auth_code
    };
    app.alipay_f2f.openAuthTokenApp(bizContent).then(result => {
      result.should.have.property('app_auth_token');
      result.should.have.property('app_refresh_token');
      token = result;
      done();
    }, done)
  })
  
  it('should refresh ok', function(done){
    const bizContent = {
      grant_type: 'refresh_token',
      refresh_token: token.app_refresh_token
    }
    app.alipay_f2f.openAuthTokenApp(bizContent).then(result => {
      console.log(result);
      result.should.have.property('app_auth_token');
      result.should.have.property('app_refresh_token');
      done();
    }, done)
  })
})

// { code: '10000',
//   msg: 'Success',
//   app_auth_token: '201702BB8bc9d194e74248e986444856bae13X20',
//   app_refresh_token: '201702BB02410f54992141e190b390fea7ec0X20',
//   auth_app_id: '2016073100134952',
//   expires_in: 31536000,
//   re_expires_in: 32140800,
//   user_id: '2088102169331202' }