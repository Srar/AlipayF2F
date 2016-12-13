var alipay_f2f = require("./index.js");

alipay_f2f = new alipay_f2f({
    appid: 2016072400105712,
    notifyUrl: "http://www.qq.com",
    merchantPrivateKey: `-----BEGIN RSA PRIVATE KEY-----
MIICXgIBAAKBgQC/PWGaI4wSH+VkyyPLrALVccCJgNZNYjDkl5TGxsVG/26kzdTm
vmcUcnA1UiVk3ySFpk6ZXYzmVZoAXsyI8y35+8uzAhqIxMkYts4gKqdDidrlfFg4
Nyf9uNii5MIFH2wOi1iWWYQ8Woq1dGxCfopJIggy7UCcud5VuDYplenk1wIDAQAB
AoGBAKAjpzpqr91xhibcEHJ57LmNkpvSHiIYqjaRVA0L36CvPpiUn8ZFBI5TsfCE
hDmuvaeI9uJoOxeZ8OaEe6PmdsUcWZvk/d71MkzF3IoMYzJHQti5kukIbzYpSHFM
4u89mKpGwVi13fM0Jgq3q76UJKrDb03rTgxuP0cZEMTdgrshAkEA+OKBUZAQpkml
Trv4CtqcG+1Yn8G3qNomL968f1BIzqleWRkInd8AgAbeTRk4OquFdplKfryRfntN
j3K054iv0QJBAMS0/mbjq388ReaL4XKzhYcyVTj4sYx6nw5RH9/e/oCAJmjuTyYg
PWNJORx7MF4nvII6igXA8bWdkaXvVoRoXCcCQF4Z7gEzskfdMoZpZahc7YdVnxuQ
N+u8x5Fz6ttMNKsGuKiBYZOnPF4ruqN19J+iOG0WGmd+zpf+8N1a5nFgafECQQDC
cBosgA2MZnq96jT+mT97JSCigQmXz7mbgEsekqFFSectv6qTCDlGBCIk6gwkdejb
XZwDFfaWzFslB9CgbzvvAkEAgC4JJXgaphgwP3+K+RCGajez9nayAorEPWNUIy5S
uEPegK6jNyndyfh/mGZ5avZ6t4xwGBIpTdSsH/0tF5u93Q==
-----END RSA PRIVATE KEY-----`
});

alipay_f2f.createQRPay({
    tradeNo: "123",
    subject: "女装",
    totalAmount: 0.5
}).then(result => {
    console.log(result)
}).catch(error => console.error(error));
