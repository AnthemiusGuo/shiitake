var BaseUserRouter = require('framework/router/userRouter');
var UserRouter = BaseUserRouter.extend({
	on_msg_user_loginReq : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["uid","ticket","from"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.allowLoginFrom[data.from])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		//转换信令里的from为config的应用路由
		//这是为了信令可以短或者用数字
		data.game = config.allowLoginFrom[data.from];
		//校验用户 ticket 等，放在后面了
		
		//异步初始化玩家信息，获取用户信息后回复 login 请求
		this.app.doLogin(data,userSession,packetSerId);
	},
	on_msg_zha_enterGame : function(userSession,ret,ts,data,packetSerId) {


	}
});
module.exports = UserRouter;