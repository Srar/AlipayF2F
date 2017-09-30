const request    = require("request");
const signHelper = require("./signHelper.js");


/* 阿里文档说这叫时间戳？ */
function  _getAlipayVersionTimestamp() {
    var date = new Date();
    var month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
    var day   = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var mins  = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var sec   = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return `${date.getFullYear()}-${month}-${day} ${hours}:${mins}:${sec}`;
}

module.exports = {

    /**
     * 校验通知签名
     * @param  {Object}  postData  支付宝post过的来数据
     * @param  {Object}  config    配置信息
     * @return {Boolean}           是否通过校验   
     */
    notifyVerify(postData, config) {
        var sign     = postData["sign"];
        var signType = postData["sign_type"];
        if(sign == undefined || signType == undefined || sign == "" || signType == "") {
            return false;
        }

        delete postData["sign"];
        delete postData["sign_type"];

        postData = signHelper.sortObject(postData);

        var signContent = signHelper.formatParams(postData, false, false);

        return signHelper.verifyContent(signContent, sign, config["alipayPublicKey"]);
    },
    
    /**
     * 执行API
     * @param  {String}  method    api名
     * @param  {Object}  config    配置信息
     * @param  {Object}  apiParams api自有参数
     * @return {Promise}
     */
    execute(method, config, apiParams) {
        return new Promise((resolve, reject) => {
            var sysParams = {
                app_id: config["appid"],
                version: "1.0",
                format: "JSON",
                "sign_type": "RSA2",
                method: method,
                timestamp: _getAlipayVersionTimestamp(),
                alipay_sdk: "alipayf2f_nodejs",
                notify_url: config["notifyUrl"],
                charset: "UTF-8"
            };

            var apiParamsContent = JSON.stringify(apiParams);
            var signContent      = signHelper.getSignContent(sysParams, { biz_content: apiParamsContent });
	        var sign             = null;

	        try {
	            sign = signHelper.getSign(signContent, config.merchantPrivateKey);
            } catch (ex) {
		        return reject({ message: "生成请求签名时错误", info : ex });
	        }

            // 将API公有参数放入GET请求串
            var requestUrl = config.gatewayUrl + "?";
            requestUrl += signHelper.formatParams(sysParams, false, true);
            requestUrl += `&sign=${encodeURIComponent(sign)}`;

            request.post(requestUrl, { form: { biz_content: apiParamsContent }, json: false }, function (err, res, body) {
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
