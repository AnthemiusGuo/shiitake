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
	},
	on_msg_game_default : function(method,userSession,ret,ts,data,packetSerId) {
		//游戏服务器的大厅各种其他游戏指令
		if (!utils.checkParam(data,["gameId"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		if (userSession.gameId != data.gameId) {
			userSession.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}
		//基本校验之后，直接转发到游戏服务器
		data.uid = userSession.uid;

		rpc.call(config.gameIdToServer[data.gameId],"game",method,{serverId:userSession.gameServerId},data,function(category,method,ret,data,req){
			if (F.isset(this["handle_data_"+category+"_"+method])){
				data = this["handle_data_"+category+"_"+method](data);
			}
			userSession.send(category,method,ret,packetSerId,data);

			logger.info("transfer req to game server",ret,data);
		}.bind(this));
		
	},
	on_msg_table_default : function(method,userSession,ret,ts,data,packetSerId) {
		//游戏服务器的大厅各种其他游戏指令
		if (!utils.checkParam(data,["gameId"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		if (userSession.gameId != data.gameId) {
			userSession.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}
		//基本校验之后，直接转发到游戏服务器
		data.uid = userSession.uid;
		
		rpc.call(config.gameIdToServer[data.gameId],"game",method,{serverId:userSession.gameServerId},data,function(category,method,ret,data,req){
			//有的rpc 数据只返回 uid，但是实际需要 userInfo
			if (F.isset(this["handle_data_"+category+"_"+method])){
				data = this["handle_data_"+category+"_"+method](data);
			}
			userSession.send(category,method,ret,packetSerId,data);
			logger.info("transfer req to game server",ret,data);
		});
		
	},
	handle_data_game_joinTableAck:function(data) {
		//覆盖在线用户列表
		for (var uid in data.usersIn){
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				data.usersIn[uid] = null;
				continue;
			}
			data.usersIn[uid] =  logicApp.uidUserMapping[uid].getUserShowInfo();
		}
		return data;
	}
});
module.exports = UserRouter;