var BaseController = require("app/controllers/client/base/BaseController");
var UserCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},
	login : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["uid"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		//校验用户 ticket 等，这里先省略
		
		//如果是异步，回调时候做这个
		var ret = this.app.login(data.uid,userSession);
		if (ret==1) {
			userSession.send("user","login",1,packetId,{})
		} else {
			userSession.send("user","login",ret,packetId,{e:"登录失败"})
		}
		
	}
});

module.exports = UserCtrller;