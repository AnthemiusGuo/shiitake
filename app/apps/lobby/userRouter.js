var BaseUserRouter = require('framework/router/userRouter');
var UserRouter = BaseUserRouter.extend({
	init : function(typ,app){
		this._super(typ,app);
		this.LOGIN_CACHE_EXPIRE = app.LOGIN_CACHE_EXPIRE;

	},
	updateOnlineSession : function(uid) {
		//用户只要有信令上来，就刷新下他的redis时间
		var real_key = "user/lobby/"+uid;
        kvdb.expire(real_key,this.LOGIN_CACHE_EXPIRE,redis.print);
        real_key = "user/baseInfo/"+uid;
        kvdb.expire(real_key,this.LOGIN_CACHE_EXPIRE,redis.print);
	},
	on_msg_user_loginReq : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["uid","ticket","from"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.from])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		//转换信令里的from为config的应用路由
		//这是为了信令可以短或者用数字
		data.game = config.gameIdToServer[data.from];
		//校验用户 ticket 等，放在后面了
		
		//异步初始化玩家信息，获取用户信息后回复 login 请求
		this.app.doLogin(data,userSession,packetSerId);
	},
	on_msg_game_enterGameReq : function(userSession,ret,ts,data,packetSerId) {
		this.updateOnlineSession(userSession.uid);
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["roomId","gameId"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		var gameModule = config.gameIdToServer[data.gameId];
		this.app.doEnterGame(gameModule,data,userSession,packetSerId);
	}
});
module.exports = UserRouter;