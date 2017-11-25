var app = require('./fixtures/app');


describe.only('二维码生成 & 退款', function () {
    var payment = {
        tradeNo: Date.now().toString() + Math.floor(Math.random() * 9999) + 1,
        subject: "女装",
        totalAmount: 100
    }

    it('二维码生成', function (done) {
        app.alipay_f2f.createQRPay(payment).then(result => {
            result.should.have.property('code', '10000');
            result.should.have.property('qr_code');
            console.log(result);
            if (result.code === "10000") {
                console.log("请手动将[qr_code]生成为二维码然后扫码付款.");
            }
            done();
        }).catch(err => {
            console.log(err.message);
            if(err.info != undefined) console.log(err.info);
            done(err);
            process.exit(0);
        });
    });

    it('商户订单号退款', function (done) {
        this.timeout(120 * 1000);
        function checkInvoice() {
            app.alipay_f2f.checkInvoiceStatus(payment.tradeNo).then(result => {
                if (result.code != 10000 || result.trade_status != "TRADE_SUCCESS") {
                    return setTimeout(checkInvoice.bind(this), 2000);
                }
                console.log(result);
                app.alipay_f2f.refund(payment.tradeNo, { refundAmount: payment.totalAmount }).then(result => {
                    result.should.have.property("code", "10000");
                    done();
                }).catch(done)
            }).catch(done);
        }
        setTimeout(checkInvoice.bind(this), 2000);
    });
})

describe.only('条码支付 & 退款', function () {
    var payment = {
        tradeNo: Date.now().toString() + Math.floor(Math.random() * 9999) + 1,
        subject: "女装",
        totalAmount: 100,
        authCode: ""
    }

    function waitingForInput() {
        return new Promise((resolve, reject) => {
            process.stdin.resume();
            process.stdin.setEncoding("utf8");
            process.stdin.once("data", (data) => {
                resolve(data.trim());
            });
        });
    }

    it('条码支付', function (done) {
        this.timeout(160 * 1000);
        console.log("请打开 支付宝->付款 输入条码编号.");
        process.stdout.write("编号:");
        waitingForInput().then((authCode) => {
            payment.authCode = authCode;
            return app.alipay_f2f.createBarCodePay(payment);
        }).then(result => {
            result.should.have.property('code', '10000');
            console.log(result);
            done();
        }).catch(err => {
            console.log(err.message);
            if(err.info != undefined) console.log(err.info);
            done(err);
            process.exit(0);
        });
    });

    it('商户订单号退款', function (done) {
        this.timeout(120 * 1000);
        function checkInvoice() {
            app.alipay_f2f.checkInvoiceStatus(payment.tradeNo).then(result => {
                if (result.code != 10000 || result.trade_status != "TRADE_SUCCESS") {
                    return setTimeout(checkInvoice.bind(this), 2000);
                }
                console.log(result);
                app.alipay_f2f.refund(payment.tradeNo, { refundAmount: payment.totalAmount }).then(result => {
                    result.should.have.property("code", "10000");
                    done();
                }).catch(done)
            }).catch(done);
        }
        setTimeout(checkInvoice.bind(this), 2000);
    });
})