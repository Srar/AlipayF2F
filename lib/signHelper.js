const crypto     = require("crypto");

module.exports = {
    
    /**
     * 验证签名
     * @param  {Object} content     签名串
     * @param  {Object} privateKey  公钥
     */
    verifyContent: function(content, sign, publicKey) {
	    var verifySign = crypto.createVerify('RSA-SHA1');
	    verifySign.update(content);
	    return verifySign.verify(publicKey, sign, 'base64');
    },
    
    /**
     * 生成签名
     * @param  {Object} content     签名内容
     * @param  {Object} privateKey  私钥
     */
    getSign: function (content, privateKey) {
	    var cryptoSign = crypto.createSign("RSA-SHA1");
        cryptoSign.update(content, "utf8");
        return cryptoSign.sign(privateKey, "base64");
    }, 

    /**
     * 生成签名内容
     * @param {Object} sysParams     内部信息
     * @param {Object} invoiceParams 订单信息
     */
    getSignContent: function (sysParams, invoiceParams) {
        var temp = [];
        Object.keys(sysParams).forEach(function(key) {
            temp[key] = sysParams[key];
        });
        Object.keys(invoiceParams).forEach(function(key) {
            temp[key] = invoiceParams[key];
        });

        temp = this._sortObject(temp);

        var content = "";
        Object.keys(temp).forEach(function(key, idx) {
            var value = temp[key];
            if(value == "") {
                return;
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
     * 根据Object键名来排序
     * @param {Object} obj 需要排序的Object
     */
    _sortObject: function (obj) {
        return Object.keys(obj).sort().reduce((r, k) => (r[k] = obj[k], r), {});
    }

}