var helper = {
    //生成随机字符串
    "randomString": function randomString(len = 32) {
        len = len;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var maxPos = $chars.length;
        var str = '';
        for (i = 0; i < len; i++) {
            str += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return str;
    },
    //不可逆加密字符串(暂时不用)
    "encryptPwd": function encryptPwd(pwd, salt) {
        var crypto = require('crypto');
        var content = pwd + salt;
        var md5 = crypto.createHash('md5');
        md5.update(content);
        var sign = md5.digest('hex');
        return sign;
    },
    //加密算法
    "aesEncode": function aesEncode(str, salt) {
        var crypto = require('crypto');
        const cipher = crypto.createCipher('aes192', salt);
        var crypted = cipher.update(str, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },
    //解密算法
    "aesDecode": function aesDecode(encrypted, salt) {
        var crypto = require('crypto');
        const decipher = crypto.createDecipher('aes192', salt);
        var decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    },
    //返回内容拼接
    "json": function json(code, msg, data = null) {
        return { code: code, msg: msg, data: data }
    },
    "dateFormate": function dateFormate(str = 'yyyy-MM-dd hh:mm:ss') {
        var that = new Date();
        var o = {
            "M+": that.getMonth() + 1, //月份
            "d+": that.getDate(), //日
            "h+": that.getHours(), //小时
            "m+": that.getMinutes(), //分
            "s+": that.getSeconds(), //秒
            "q+": Math.floor((that.getMonth() + 3) / 3), //季度
            "S": that.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (that.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
}

module.exports = helper;