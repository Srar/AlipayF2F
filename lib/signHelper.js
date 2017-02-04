const crypto     = require("crypto");

module.exports = {
    
    /**
     * 验证签名
     * @param   {String} content     签名串
     * @param   {String} content     签名
     * @param   {String} publicKey   公钥
     * @returns {Boolean}
     */
    verifyContent: function(content, sign, publicKey) {
	    var verifySign = crypto.createVerify('RSA-SHA256');
	    verifySign.update(content);
	    return verifySign.verify(publicKey, sign, 'base64');
    },

    /**
     * 将Params Object对象格式化为`a=1&b=2`姓氏
     * @param   {Object}   params         params
     * @param   {Boolean}  skipEmptyValue 是否跳过 value 为空的object
     * @param   {Boolean}  urlEncodeValue 是否将value进行url编码
     * @returns {String}
     */
    formatParams: function(params, skipEmptyValue, urlEncodeValue) {
        var content = "";

        Object.keys(params).forEach(function(key, idx) {
            var value = params[key];
            if(value == "" && skipEmptyValue) {
                return;
            }
            
            if(urlEncodeValue) {
                value = encodeURIComponent(value);
            }

            if(idx == 0) {
                content += `${key}=${value}`;
            } else {
                content += `&${key}=${value}`;
            }
        });
        return content;
    },
    
    /**
     * 生成签名
     * @param   {String} content     签名内容
     * @param   {String} privateKey  私钥
     * @returns {String} 
     */
    getSign: function (content, privateKey) {
	    var cryptoSign = crypto.createSign("RSA-SHA256");
        cryptoSign.update(content, "utf8");
        return cryptoSign.sign(privateKey, "base64");
    }, 

    /**
     * 生成签名内容
     * @param {Object} sysParams api公有参数
     * @param {Object} apiParams api自有参数
     */
    getSignContent: function (sysParams, apiParams) {
        var temp = [];
        Object.keys(sysParams).forEach(function(key) {
            temp[key] = sysParams[key];
        });
        Object.keys(apiParams).forEach(function(key) {
            temp[key] = apiParams[key];
        });

        temp = this.sortObject(temp);

        return this.formatParams(temp, true, false);
    }, 

    /**
     * 根据Object键名来排序
     * @param   {Object} obj 需要排序的Object
     * @returns {Object}
     */
    sortObject: function (obj) {
        return Object.keys(obj).sort().reduce((r, k) => (r[k] = obj[k], r), {});
    }

}