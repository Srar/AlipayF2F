const qr      = require('qr-image');
const express = require('express');
const router  = express.Router();

router.get("/", (req, res) => {
	res.render("index");
});

router.post("/createInvoice", (req, res) => {
	var amount = req.body.amount || "";
	if(amount == "") {
		return res.error("请填写测试金额.");
	}
	amount = parseFloat(amount);
	if(isNaN(amount) || amount <= 0) {
		return res.error("测试金额输入错误.");
	}
	/* 支付宝支持2位小数的金额 */
	amount = amount.toFixed(2);

	/* 生成订单唯一编号 仅作为演示 请勿使用在生产环境 */
	var noInvoice = `alipayf2f_${new Date().getTime()}`;

	var createInvoiceResult = null;

	/* 参数详细请翻源码 */
	req.alipayf2f.createQRPay({
		tradeNo: noInvoice,
		subject: "测试订单",
		totalAmount: amount,
		body: "女装物品",
		timeExpress: 5,
	}).then(result => {
		if(result.code != 10000) {
			console.error(result);
			return res.error("支付宝网关返回错误, 请联系管理员.");
		}
		createInvoiceResult = result;
		return req.database.insert(noInvoice, { pay: false })
	}).then((result) =>
		res.success({
			qrCode: createInvoiceResult["qr_code"],
			noInvoice: noInvoice
		})
	).catch(error => {
		if(error.info != null) {
			console.error(error.message, error.info);
		}
		res.error(error.message);
	});
});

router.post("/callback", (req, res) => {
	var signStatus = req.alipayf2f.verifyCallback(req.body);
	if(signStatus === false) {
		return res.error("回调签名验证未通过");
	}

	var noInvoice = req.body["out_trade_no"];
	var invoiceStatus = req.body["trade_status"];

	if(invoiceStatus !== "TRADE_SUCCESS") {
		return res.send("success");
	}

	req.database.update(noInvoice, { pay: true }).then(result => res.send("success")).catch(err => res.catch(err));
});


router.post("/checkInvoice", (req, res) => {
	var noInvoice = req.body.noInvoice || "";
	if(noInvoice == "") {
		return res.error("订单号不能为空");
	}
	req.database.get(noInvoice).then(result => {
		if(result == null) {
			return false;
		}
		res.success(result.pay)
	}).catch(err => res.catch(err))
});


/* 轮询支付宝API获取支付结果 不推荐 */
//router.post("/checkInvoice", (req, res) => {
//	var noInvoice = req.body.noInvoice || "";
//	if(noInvoice == "") {
//		return res.error("请填写订单号.");
//	}
//
//	req.alipayf2f.checkInvoiceStatus(noInvoice).then(result => {
//		res.send({
//			code: result["code"],
//			sub_msg: result["sub_msg"]
//		});
//	}).catch(error => {
//		if(error.info != null) {
//			console.error(error.message, error.info);
//		}
//		res.error(error.message);
//	});
//});


router.get('/createQRCode', (req, res) => {
	var text = req.query.text || "";
	try {
		var img = qr.image(text,{size :10});
		res.writeHead(200, {'Content-Type': 'image/png'});
		img.pipe(res);
	} catch (e) {
		res.writeHead(414, {'Content-Type': 'text/html'});
		res.end('<h1>414 Request-URI Too Large</h1>');
	}
});


module.exports = router;