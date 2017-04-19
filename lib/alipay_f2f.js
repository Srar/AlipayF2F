"use strict";

const aop  = require("./aop.js");

module.exports = class alipay_f2f {

    constructor(config) {
        this._config = {};
        this._config["appid"] = config["appid"] || "";
        this._config["notifyUrl"] = config["notifyUrl"] || "";
        /* 默认为沙盒 详见 https://openhome.alipay.com/platform/appDaily.htm */
        this._config["gatewayUrl"] = config["gatewayUrl"] || "https://openapi.alipaydev.com/gateway.do";
        this._config["merchantPrivateKey"] = config["merchantPrivateKey"] || "";
        this._config["alipayPublicKey"] = config["alipayPublicKey"] || 
`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA26kCbp+LscnLHMdwMQ0ewc29g1N3TB6YRviqu0iHwRm5sfEawucGrOdoqE27fPV8QyU14uNS3fW+IKjEy9bPYFMmlZySod6WdVmJEUw+IfIfkWXd4QylbnEFbY8DRf1hTYKhnqUMA1O9Iy7wDTvt5fj4pRZqg7OBUzhwj1EpGsyBNYL1oLvjTiR/WYLd4wXpWteURMtm35IY6HM3y1sKQpjOb78ec1mX+HBppVQ8Y4hYIfdbicQ3Kxo8E6VGiK65pcT3UQyl11RmhM7WUJ5I783nS5gZaR5CURmsG8etvEkUU0LQtE6SqfiQ79LDNCHegXfWR2mgMJ+2jl9h0IXkuwIDAQAB
-----END PUBLIC KEY-----`;
    }

	/**
     * 校验通知签名
     * @param  {string} postData  支付宝post过的来数据
     * @return {bool}             是否通过校验   
     */
	verifyCallback(postData) {
		return aop.notifyVerify(postData, this._config);
	}

	/**
	 * 使用商户订单号检测订单状况
	 * @param  {string} tradeNo 商户订单号
	 * @return {Promise}
	 */
	checkInvoiceStatus(tradeNo) {
		return new Promise((resolve, reject) => {
			if (tradeNo == "" || tradeNo == null || tradeNo == undefined) {
				return reject({ message: "订单号不能为空.", info : null });
			}
			aop.execute("alipay.trade.query", this._config, {
				out_trade_no: tradeNo
			}).then(resolve).catch(reject);
		});
	}

	/**
	 * 使用支付宝订单号检测订单状况
	 * @param  {string} tradeNo 支付宝订单号
	 * @return {Promise}
	 */
	checkInvoiceStatusWithAlipayTradeNo(alipayTradeNo) {
		return new Promise((resolve, reject) => {
			if (alipayTradeNo == "" || alipayTradeNo == null || alipayTradeNo == undefined) {
				return reject({ message: "订单号不能为空.", info : null });
			}
			aop.execute("alipay.trade.query", this._config, {
				trade_no: alipayTradeNo
			}).then(resolve).catch(reject);
		});
	}

    /**
     * 创建二维码订单
     * @param {Object} option 支付参数
     *        必填 tradeNo(String)              商户网站订单系统中唯一订单号，64个字符以内，只能包含字母、数字、下划线需保证商户系统端不能重复，建议通过数据库sequence生成.
     *        必填 subject(String)              订单标题，粗略描述用户的支付目的。如“xxx品牌xxx门店当面付扫码消费”
     *        必填 totalAmount(Double)          订单总金额，整形，此处单位为元，精确到小数点后2位，不能超过1亿元
     *        可填 body(String)                 订单描述，可以对交易或商品进行一个详细地描述，比如填写"购买商品2件共15.00元"
     *        可填 timeExpress(Int)             支付超时，线下扫码交易定义为5分钟
     * @return {Promise}
     */
    createQRPay(option) {
    	return new Promise((resolve, reject) => {
		    var tradeNo     = option["tradeNo"] || "";
		    var subject     = option["subject"] || "";
		    var body        = option["body"] || "";
		    var totalAmount = option["totalAmount"] || "";
		    var timeExpress = option["timeExpress"] || 5;

		    if (tradeNo == "") {
			    return reject({
			    	message: "tradeNo 参数不能为空.", info : null
			    });
		    }

		    if (subject == "") {
			    return reject({
				    message: "subject 参数不能为空.", info : null
			    });
		    }

		    if (totalAmount == "") {
			    return reject({
				    message: "totalAmount 参数为空.", info : null
			    });
		    }
		    totalAmount = parseFloat(totalAmount);
		    if (isNaN(totalAmount)) {
			    return reject({
				    message: "totalAmount 参数非法.", info : null
			    });
		    }

		    if (timeExpress == "") {
			    return reject({
				    message: "timeExpress 参数为空.", info : null
			    });
		    }
		    timeExpress = parseInt(timeExpress);
		    if (isNaN(timeExpress)) {
			    return reject({
				    message: "timeExpress 参数非法.", info : null
			    });
		    }
		    timeExpress = timeExpress + "m";

		    var alipayArrayData = {};
		    alipayArrayData["subject"] = subject;
		    alipayArrayData["body"] = body;
		    alipayArrayData["out_trade_no"] = tradeNo;
		    alipayArrayData["total_amount"] = totalAmount;
		    alipayArrayData["timeout_express"] = timeExpress;

		    aop.execute("alipay.trade.precreate", this._config, alipayArrayData).then(resolve).catch(reject);
	    });
      
    }

	/**
	 * 使用商户订单号请求退款操作
	 * @param {String} 商户订单号
	 * @param {Object} option
	 *        必填 refundAmount(Price) 需要退款的金额，该金额不能大于订单金额,单位为元，支持两位小数  
	 *        选填 refundNo(String)    标识一次退款请求，同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传
	 * @return {Promise}
	 */
	refund(tradeNo, option) {
		return new Promise((resolve, reject) => {
			if(tradeNo === undefined || tradeNo === "" || typeof tradeNo != "string") {
				return reject({ message: "tradeNo 商户订单号不能为空.", info : null });
			}
			var refundNo     = option["refundNo"];
			var refundAmount = parseFloat(option["refundAmount"] || "");
			if(isNaN(refundAmount)) {
				return reject({ message: "refundAmount 退款金额错误.", info : null });
			}
			var alipayArrayData = {};
			alipayArrayData["out_trade_no"] = tradeNo;
			alipayArrayData["refund_amount"] = refundAmount;
			if(refundNo !== undefined) {
				alipayArrayData["out_request_no"] = refundNo;
			}
			aop.execute("alipay.trade.refund", this._config, alipayArrayData).then(resolve).catch(reject);
		});	
	}

	/**
	 * 使用支付宝订单号请求退款操作
	 * @param {String} 支付宝订单号
	 * @param {Object} option
	 *        必填 refundAmount(Price) 需要退款的金额，该金额不能大于订单金额,单位为元，支持两位小数  
	 *        选填 refundNo(String)    标识一次退款请求，同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传
	 * @return {Promise}
	 */
	refundWithAlipayTradeNo(alipayTradeNo, option) {
		return new Promise((resolve, reject) => {
			if(alipayTradeNo === undefined || alipayTradeNo === "" || typeof alipayTradeNo != "string") {
				return reject({ message: "alipayTradeNo 支付宝订单号不能为空.", info : null });
			}
			var refundNo     = option["refundNo"];
			var refundAmount = parseFloat(option["refundAmount"] || "");
			if(isNaN(refundAmount)) {
				return reject({ message: "refundAmount 退款金额错误.", info : null });
			}
			var alipayArrayData = {};
			alipayArrayData["trade_no"] = alipayTradeNo;
			alipayArrayData["refund_amount"] = refundAmount;
			if(refundNo !== undefined) {
				alipayArrayData["out_request_no"] = refundNo;
			}
			aop.execute("alipay.trade.refund", this._config, alipayArrayData).then(resolve).catch(reject);
		});
	}
};

