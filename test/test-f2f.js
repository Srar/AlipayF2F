var app = require('./fixtures/app');

var payment = {
  tradeNo: '1486372683551',
  subject: "女装",
  totalAmount: 100
}

describe.only('QRPay', function(){
  
  it('should ok', function(done){
    app.alipay_f2f.createQRPay(payment).then(result => {
      result.should.have.property('code', '10000');
      result.should.have.property('qr_code');
      payment = result;
      console.log(result);
      done();
    }, done);
  })
  
})

describe.skip('Refund', function(){
  
  this.timeout(10000);
  
  it('should ok', function(done){
    var refund = {
      tradeNo: payment.tradeNo,
      refundNo: Date.now(),
      refundAmount: payment.totalAmount
    }
    app.alipay_f2f.refund(refund).then(result => {
      console.log(result);
      result.should.have.property('code', '10000');
      result.should.have.property('refund_fee');
      done();
    }, done);
  })
})