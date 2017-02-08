"use strict";

const app = require('./fixtures/app');

const payment = {
  tradeNo: '1486372683551',
  subject: "女装",
  totalAmount: 100
}

const app_auth_token = '201702BB8bc9d194e74248e986444856bae13X20'

describe('QRPay', function(){
  
  it('should ok', function(done){
    app.alipay_f2f.createQRPay(payment).then(result => {
      result.should.have.property('code', '10000');
      result.should.have.property('qr_code');
      console.log(result);
      done();
    }, done);
  })
  
})

describe.skip('CreateRefund', function(){
  
  this.timeout(10000);
  
  it('should ok', function(done){
    const refund = {
      tradeNo: payment.tradeNo,
      refundNo: Date.now(),
      refundAmount: payment.totalAmount
    }
    app.alipay_f2f.createRefund(refund).then(result => {
      result.should.have.property('code', '10000');
      result.should.have.property('refund_fee');
      done();
    }, done);
  })
})

const trade = {
  out_trade_no: Date.now(),
  auth_code: '289176638952217693',
  subject: '条码当面付手机',
  total_amount: '68.88',
  app_auth_token: app_auth_token
}

describe('Pay', function(){
  this.timeout(30000);
  
  it('should ok', function(done){
    app.alipay_f2f.pay(trade).then(result => {
      result.should.have.property('code', '10000');
      done();
    }, done);
  });
})

const option = {
  out_trade_no: trade.out_trade_no,
  app_auth_token: app_auth_token
};

describe('Cancel', function(){
  
  it('should ok', function(done){
    app.alipay_f2f.cancel(option).then(result => {
      result.should.have.property('code', '10000');
      result.should.have.property('action');
      done();
    }, done);
  })
  
})

describe('Query', function(){
  it('should ok', function(done){
    app.alipay_f2f.query(option).then(result=>{
      result.should.have.property('code', '10000');
      result.should.have.property('total_amount');
      done();
    }, done)
  })
})

describe.only('Precreate', function(){
  
  const option = {
    out_trade_no: '1486372683556',
    subject: "耳机",
    total_amount: 168,
    app_auth_token: app_auth_token
  }
  
  it.skip('should ok', function(done){
    app.alipay_f2f.precreate(option).then(result=>{
      result.should.have.property('code', '10000');
      result.should.have.property('qr_code');
      console.log(result);
      done();
    }, done)
  })
  
  describe('Refund', function(){
    this.timeout(5000);    

    let refund;
    
    before(function(){
      refund = {
        out_trade_no: option.out_trade_no,
        out_request_no: Date.now(),
        refund_amount: option.total_amount,
        app_auth_token: app_auth_token
      }
    })

    it('should ok', function(done){
    
      app.alipay_f2f.refund(refund).then(result=>{
        result.should.have.property('code', '10000');
        result.should.have.property('refund_fee');
        done();
      }, done)
    })
    
    after(function(done){
      const data = {
        out_trade_no: refund.out_trade_no,
        out_request_no: refund.out_request_no,
        app_auth_token: app_auth_token
      }
      app.alipay_f2f.refundQuery(data).then(result=>{
        result.should.have.property('code', '10000');
        done()
      }, done)
    })
  })
})