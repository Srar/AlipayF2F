const request    = require("request");
const signHelper = require("./signHelper.js");


/* 阿里文档说这叫时间戳？ */
function  _getAlipayVersionTimestamp() {
    var date = new Date();
    var month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : date.getMonth();
    var day   = date.getDate() < 10 ? "0" + date.getDate() + 1 : date.getDate();
    var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var mins  = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var sec   = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return `${date.getFullYear()}-${month}-${day} ${hours}:${mins}:${sec}`;
}

module.exports = {
    /**
     * 校验通知签名
     * @param  {string} postData  支付宝post过的来数据
     * @param  {object} config    配置信息
     * @return {bool}             是否通过校验   
     */
    notifyVerify(postData, config) {
        var sign     = postData["sign"];
        var signType = postData["sign_type"];
        if(sign == undefined || signType == undefined || sign == "" || signType == "") {
            return false;
        }

        delete postData["sign"];
        delete postData["sign_type"];

        postData = signHelper._sortObject(postData);

        var signContent = "";
        Object.keys(postData).forEach(function(key, idx) {
            var value = postData[key];
            if(idx == 0) {
                signContent += `${key}=${value}`;
            } else {
                signContent += `&${key}=${value}`;
            }
        });

        return signHelper.verifyContent(signContent, sign, config["alipayPublicKey"]);
    },
    
    /**
     * 执行一般API
     * @param {string} method  api名
     * @param {object} config  配置信息
     * @param {object} invoice api自身自有参数
     * @return {Promise}
     */
    execute(method, config, invoice) {
        return new Promise((resolve, reject) => {
            var sysParams = {};
            sysParams["app_id"]     = config["appid"];
            sysParams["version"]    = "1.0";
            sysParams["format"]     =  "JSON";
            sysParams["sign_type"]  = "RSA";
            sysParams["method"]     =  method;
            sysParams["timestamp"]  = _getAlipayVersionTimestamp();
            sysParams["alipay_sdk"] = "alipayf2f_nodejs";
            sysParams["notify_url"] = config["notifyUrl"];
            sysParams["charset"]    = "UTF-8";

            var invoiceContent = JSON.stringify(invoice);
            var signContent    = signHelper.getSignContent(sysParams, { biz_content: invoiceContent });
	        var sign           = null;
	        try {
	            sign = signHelper.getSign(signContent, config.merchantPrivateKey);
            } catch (ex) {
		        return reject({ message: "生成请求签名时错误", info : ex });
	        }

            //系统参数放入GET请求串
            var requestUrl = config.gatewayUrl + "?";
            Object.keys(sysParams).forEach(function(key, idx) {
                var value = sysParams[key];
                if(idx == 0) {
                    requestUrl += `${key}=${encodeURIComponent(value)}`;
                } else {
                    requestUrl += `&${key}=${encodeURIComponent(value)}`;
                }
            });
            requestUrl += `&sign=${encodeURIComponent(sign)}`;

            request.post(requestUrl, { form: { biz_content: invoiceContent }, json: false }, function (err, res, body) {
                if(err) {
	                return reject({ message: "请求支付宝网关时发生错误", info : err });
                }

	            var jsonBody = null;
                try{
	                 jsonBody = JSON.parse(body);
                } catch(ex) {
	                return reject({ message: "支付宝返回数据转换为JSON失败.", info : body });
                }
                
                var dataSign = jsonBody["sign"];
                if(dataSign == undefined) {
	                return reject({ message: "验证支付宝签名时获取[sign]字段失败", info : jsonBody });
                }

                /* alipay.trade.precreate转成alipay_trade_precreate_response */
                var rootNodeName = method.replace(/\./g, "_") + "_response";
                if(jsonBody[rootNodeName] != undefined) {
                    var dataString = JSON.stringify(jsonBody[rootNodeName]).replace(/\//g, "\\/");
                    try {
	                    if(!signHelper.verifyContent(dataString , dataSign, config.alipayPublicKey)) {
		                    return reject({ message: "支付宝签名验证失败", info : jsonBody });
	                    }
                    } catch (ex) {
	                    return reject({ message: "支付宝签名验证过程中出现异常", info : ex });
                    }
                    return resolve(jsonBody[rootNodeName]);
                }

                if(body["error_response"] != undefined) {
	                return reject({ message: "支付宝网关返回错误", info : jsonBody });
                }

	            return reject({
		            message: `验证支付宝签名时获取[${rootNodeName}]字段失败` ,info : jsonBody
	            });
            });
        })
    }
}