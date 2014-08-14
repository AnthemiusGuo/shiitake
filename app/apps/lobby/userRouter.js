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
	on_msg_user_loginReq : function(client,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["uid","ticket","from"])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.from])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}

		//转换信令里的from为config的应用路由
		//这是为了信令可以短或者用数字
		data.game = config.gameIdToServer[data.from];
		//校验用户 ticket 等，放在后面了
		
		//异步初始化玩家信息，获取用户信息后回复 login 请求
		this.app.doLogin(data,client,packetSerId);
		//这一唯一两条使用client处理的信令（还有ping），其他信令都是登录后信令，获取uid和user处理
	},
	on_msg_game_enterGameReq : function(client,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["roomId","gameId"])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!this.checkUserLogined(client,packetSerId)){
			return;
		}
		this.updateOnlineSession(client.uid);

		var userSession = this.app.uidUserMapping[client.uid];
		var gameModule = config.gameIdToServer[data.gameId];
		this.app.doEnterGame(gameModule,data,userSession,packetSerId);
	},
	on_msg_game_leaveGameReq : function(client,ret,ts,data,packetSerId) {
		if (!utils.checkParam(data,["gameId"])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!this.checkUserLogined(client,packetSerId)){
			return;
		}
		
		data.uid = client.uid;
		var userSession = this.app.uidUserMapping[client.uid];

		if (userSession.gameId != data.gameId) {
			client.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}
		var gameId = data.gameId;
		//基本校验之后，直接转发到游戏服务器

		rpc.call(config.gameIdToServer[gameId],"game","leaveGameReq",{serverId:userSession.gameServerId},data,function(category,method,ret,data,req){
			if (data==null){
				console.trace("null rpc reply!!! please check your code!!!");
				data = {};
			}
			data.gameId = gameId;
			client.send(category,method,ret,packetSerId,data);
			if (ret>0) {
				//成功退出游戏，清除各种缓存
				userSession.onLeaveGame();
			}
		}.bind(this));
		
	},
	on_msg_game_default : function(method,client,ret,ts,data,packetSerId) {
		//游戏服务器的大厅各种其他游戏指令
		if (!utils.checkParam(data,["gameId"])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!this.checkUserLogined(client,packetSerId)){
			return;
		}
		
		data.uid = client.uid;
		var userSession = this.app.uidUserMapping[client.uid];

		if (userSession.gameId != data.gameId) {
			client.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}
		var gameId = data.gameId;
		//基本校验之后，直接转发到游戏服务器

		rpc.call(config.gameIdToServer[gameId],"game",method,{serverId:userSession.gameServerId},data,function(category,method,ret,data,req){
			if (data==null){
				console.trace("null rpc reply!!! please check your code!!!");
				data = {};
			}
			data.gameId = gameId;
			client.send(category,method,ret,packetSerId,data);

			logger.info("transfer req to game server",ret,data);
		}.bind(this));
		
	},
	on_msg_table_default : function(method,client,ret,ts,data,packetSerId) {
		//游戏服务器的大厅各种其他游戏指令
		if (!utils.checkParam(data,["gameId"])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(config.gameIdToServer[data.gameId])) {
			client.sendErrPackFormat(packetSerId);
			return;
		}
		if (!this.checkUserLogined(client,packetSerId)){
			return;
		}

		var userSession = this.app.uidUserMapping[client.uid];

		if (userSession.gameId != data.gameId) {
			client.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}
		//基本校验之后，直接转发到游戏服务器
		data.uid = client.uid;
		var gameId = data.gameId;

		rpc.call(config.gameIdToServer[gameId],"table",method,{serverId:userSession.gameServerId},data,function(category,method,ret,data,req){
			//有的rpc 数据只返回 uid，但是实际需要 userInfo
			// if (F.isset(this["handle_data_"+category+"_"+method])){
			// 	data = this["handle_data_"+category+"_"+method](data);
			// }
			//上面邏輯拿掉了，因爲會涉及userlist內非自己lobby的用戶的數據同步問題
			data.gameId = gameId;
			client.send(category,method,ret,packetSerId,data);
			logger.info("transfer req to game server",ret,data);
		});
		
	},
});
module.exports = UserRouter;