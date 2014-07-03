var BaseController = require("app/controllers/client/base/baseController");
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
		
		//异步初始化玩家信息，获取用户信息后回复 login 请求
		this.app.login(data.uid,userSession,packetSerId);
	}
});

module.exports = UserCtrller;