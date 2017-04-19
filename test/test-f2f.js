var app = require('./fixtures/app');

var payment = {
  tradeNo: Date.now().toString(),
  subject: "女装",
  totalAmount: 100
}

describe.only('二维码生成 & 退款', function(){
  it('二维码生成', function(done){
    app.alipay_f2f.createQRPay(payment).then(result => {
      result.should.have.property('code', '10000');
      result.should.have.property('qr_code');
      console.log(result);
      if(result.code === "10000") {
        console.log("请手动将[qr_code]生成为二维码然后扫码付款.");
      }
      done();
    }, done);
  });

  it('商户订单号退款', function(done){
    this.timeout(120 * 1000);
    function checkInvoice() {
      app.alipay_f2f.checkInvoiceStatus(payment.tradeNo).then(result => {
        if(result.code != 10000 || result.trade_status != "TRADE_SUCCESS") {
          return setTimeout(checkInvoice.bind(this), 2000);
        }
        console.log(result);
        app.alipay_f2f.refund(payment.tradeNo, { refundAmount: payment.totalAmount }).then(result => {
          result.should.have.property("code", "10000");
          done();
        }).catch(err => {
          done(err);
        })
      }).catch(err => {
          done(err);
      });
    } 
    setTimeout(checkInvoice.bind(this), 2000);
  });
})