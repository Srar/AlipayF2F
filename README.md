# AlipayF2F-NodeJS
支付宝当面付NodeJS API.

# 如何使用
偷懒起见我就不提交到npm了, 如果您需要使用直接clone本项目即可.

`express-example`为express的example项目, 您可以在config.js内修改好您的当面付配置信息后直接使用.

# 5分钟快速了解
## 目前已实现的功能
* `createQRPay`: 预创建二维码支付宝订单, 当扫码后才是真创建订单.
* `verifyCallback`: 支付宝回调验签.
* `checkInvoiceStatus`: 查询订单状况.


## 屁话多!如何使用?
您先需要准备一个Object对象内部存放alipay的配置如下:



```javascript
// config.js

module.exports = {

	/* 以下信息可以在https://openhome.alipay.com/platform/appManage.htm查到, 不过merchantPrivateKey需要您自己生成 */

	/* 应用AppID */
	"appid": 0,

	/* 通知URL 接受支付宝异步通知需要用到  */
	"notifyUrl": "",

	/* 公钥 和 私钥 的填写方式 */
	"testPrivateKey": "----BEGIN RSA PRIVATE KEY-----\n" +
		          "公钥或私钥内容..." +
		          "\n-----END RSA PRIVATE KEY-----",

	/* 应用RSA私钥 请勿忘记 ----BEGIN RSA PRIVATE KEY----- 与 -----END RSA PRIVATE KEY-----  */
	"merchantPrivateKey": "",

	/* 支付宝公钥 如果为注释掉会使用沙盒公钥 请勿忘记 -----BEGIN PUBLIC KEY----- 与 -----END PUBLIC KEY----- */
	"alipayPublicKey": "",
	
	/* 支付宝支付网关 如果为注释掉会使用沙盒网关 */
	"gatewayUrl": "",
};
```

__预创建订单__

`new`一个`alipayf2f`对象并将刚刚的`config.js`传入

```javascript
var alipay_f2f = new alipayf2f(require("./config.js"));
```

然后就能使用`createQRPay`肛出一个二维码来让用户扫了

```javascript
alipay_f2f.createQRPay({
    tradeNo: "123",      // 必填 商户订单主键, 就是你要生成的
    subject: "女装",      // 必填 商品概要
    totalAmount: 0.5,    // 必填 多少钱
    body: "黑丝吊带小蜡烛", // 可选 订单描述, 可以对交易或商品进行一个详细地描述，比如填写"购买商品2件共15.00元"
    timeExpress: 5       // 可选 支付超时, 默认为5分钟
}).then(result => {
    console.log(result) // 支付宝返回的结果
}).catch(error => console.error(error));
```

如果一切都是理想情况, 支付宝应该会返回`code`为`10000`的一段这样JSON:

```json
{
    "code":"10000",
    "msg":"Success",
    "out_trade_no":"123",
    "qr_code":"https://qr.alipay.com/bax09352lmfssonc0gzr0028"
}
```
这时您就可以直接把`qr_code`中的字符串进行二维码化然后直接给用户扫就可以了!

__用户扫码并支付__

当用户付款后支付宝会发一个post请求到您设置的`notifyUrl`.

你要想确认这个回调请求是不是支付宝的该如何判断? 不要慌有个方法叫`verifyCallback`就能帮您鉴别是不是支付宝发送的了!

假设我们现在使用的是[express](http://expressjs.com/), 并且`notifyUrl`为`http://example.com/callback`

```javascript
router.post("/callback", (req, res) => {
	/* 请勿改动支付宝回调过来的post参数, 否则会导致延签失败 */
	var signStatus = alipay_f2f.verifyCallback(req.body);
	if(signStatus === false) {
		return res.error("回调签名验证未通过");
	}

	/* 商户订单号 */
	var noInvoice = req.body["out_trade_no"];
	/* 订单状态 */
	var invoiceStatus = req.body["trade_status"];

	// 支付宝回调通知有多种状态您可以点击已下链接查看支付宝全部通知状态
	// https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7386797.0.0.aZMdK2&treeId=193&articleId=103296&docType=1#s1
	if(invoiceStatus !== "TRADE_SUCCESS") {
		return res.send("success");
	}

	/* 一切都验证好后就能更新数据库里数据说用户已经付钱啦 */
	req.database.update(noInvoice, { pay: true }).then(result => res.send("success")).catch(err => res.catch(err));
});
```

> 需要注意的是当处理完支付宝回调后应当返回`success`来告诉支付宝我已经搞定了, 否则支付宝会重复通知防止掉单.

__服务器网络暴毙? 没收到支付宝回调?__

不要慌我给你实现了一个`checkInvoiceStatus`方法.

这个方法呢可以给你手动查询订单状态. 使用起来也很方便, 只需要传入一个`商户订单号`就行了:

```javascript
alipay_f2f.checkInvoiceStatus("2333333").then(result => {
  /* 返回的result就是订单信息 */
  console.log(result);
}).catch(error => { });
```
  
# 直接看看效果?
[点这里](https://alipayf2f.x-speed.cc) 然后我也不介意您给我5毛的(:
