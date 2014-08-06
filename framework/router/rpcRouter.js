var RpcRouter = Class.extend({
	init : function (typ,app){
		this.typ = typ;
		this.app = app;
	},
	onRecv: function(clientSession,package) {
		var packetSerId = package.s;
		var category = package.c;
		var method = package.m;
		var data = package.d;
		var ts = package.t;
		var ret = package.r;
		if (F.isset(this["on_msg_"+category+"_"+method])) {
			this["on_msg_"+category+"_"+method](clientSession,ret,ts,data,packetSerId);
			return;
		}
		if (F.isset(this["on_msg_"+category+"_default"])) {
			this["on_msg_"+category+"_"+method](method,clientSession,ret,ts,data,packetSerId);
			return;
		}
		this.on_msg_default_default(category,method,clientSession,ret,ts,data,packetSerId);
	},
	on_msg_default_default : function(category,method,clientSession,ret,ts,data,packetSerId) {
		logger.info("on_msg_default_default",category,method,ret,ts,data,packetSerId);
		utils.PLEASE_OVERWRITE_ME();
	},
	on_msg_rpc_login : function (clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["typ","id"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//校验ticket 等，这里先省略
		
		//初始化服务器信息
		this.app.rpc_login(data.typ,data.id,clientSession,packetSerId);
	},
	on_msg_rpc_ping : function (clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["typ","id"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		var ts =  new Date().getTime();
        clientSession.lastPing = ts;
        clientSession.send("rpc","pong",1,packetSerId,{t:ts});

		//初始化服务器信息
		this.app.rpc_ping(data.typ,data.id,data);
	},
	on_msg_user_batchReload : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["uids"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//初始化服务器信息
		this.app.batchReload(data.uids);
	},
	on_msg_rpc_serverReady : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["typ","id"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//校验用户 ticket 等，放在后面了
		
		//异步初始化玩家信息，获取用户信息后回复 login 请求
		this.app.onGameServerReady(data);
	},
	on_msg_game_enterGameReq : function(clientSession,ret,ts,data,packetSerId) {
		//游戏服务器的大厅进入游戏信令
		if (!utils.checkParam(data,["uid","lobbyId","userInfo"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		this.app.onEnterGame(clientSession,data,packetSerId);
	},
});

module.exports = RpcRouter;