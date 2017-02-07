"use strict";

const app = require('./fixtures/app');
const http = require('http');
const url = require('url');

describe.only('Token', function(){
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
      result.should.have.property('app_auth_token');
      result.should.have.property('app_refresh_token');
      done();
    }, done)
  })
})