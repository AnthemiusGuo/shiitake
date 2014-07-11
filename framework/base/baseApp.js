var BaseSocketManager = require("framework/base/baseSocketManager");
var BaseApp = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
		this.errorInfo = "";

		this.userSocketManager = new BaseSocketManager(this,"user",this.typ);
		this.rpcSocketManager = new BaseSocketManager(this,"rpc",this.typ);
		this.allReady = false;
		this.firstAllReady = false;
		this.checkReadyTick = setInterval(this.checkStatus.bind(this),3000);

		this.startTS = new Date().getTime();
		this.readyTS = 0;
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,0);
	},
	getErr : function(){
		return this.errorInfo;
	},
	setErr : function(msg){
		this.errorInfo = msg;
		logger.warn(this.id+"@"+this.typ+" : "+msg);
	},
	run : function() {
		
	},
	checkStatus : function() {
		if (rpc.allReady===false) {
			logger.info("checkStatus rpc not ready");
			this.allReady = false;
			rpc.checkRPCReady();
			return;
		} 
		if (db.allReady===false) {
			logger.info("checkStatus db not ready");
			this.allReady = false;
			return;
		} 
		if (kvdb.allReady===false) {
			logger.info("checkStatus kvdb not ready");
			this.allReady = false;
			return;
		} 

		this.allReady = true;
		clearInterval(this.checkReadyTick);
		logger.info("All server Ready!!");

		if (this.firstAllReady==false) {
			this.firstAllReady = true;
			this.onAllReady();
		}
	},
	onAllReady : function() {
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,1);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"startTS",this.startTS);

	},
	onMsg : function(rpcOrClient,socket,msg) {
		var package = JSON.parse(msg);
		if (!F.isset(package.c) || !F.isset(package.m) || !F.isset(package.d) || !F.isset(package.t) || !F.isset(package.s) || !F.isset(package.r)) {
			var packetSerId = package.s;
			this.sendToClientErrBySocket(socket,-9999,"信令格式有误",packetSerId);
			return;
		}
		var packetSerId = package.s;
		var category = package.c;
		var method = package.m;
		var data = package.d;
		var ts = package.t;
		var ret = package.r;

		if (rpcOrClient=="rpc") {
			var sockManager = this.rpcSocketManager;
		} else {
			var sockManager = this.userSocketManager;
		}
		var getRouteHandler = sockManager.initPackageRouter(category);
		if (getRouteHandler<0) {
			this.sendToClientErrBySocket(socket,getRouteHandler,"信令不存在",packetSerId);
			return;
		}
		if (!F.isset(sockManager.packageRouter[category][method])) {
			this.sendToClientErrBySocket(socket,-9997,"信令不存在",packetSerId);
			return;
		}
		if (!F.isset(sockManager.socketClientMapping[socket])) {
			this.sendToClientErrBySocket(socket,-9996,"Session丢失",packetSerId);
			return;
		}
		var userSession = sockManager.socketClientMapping[socket];

		sockManager.packageRouter[category][method](userSession,ret,ts,data,packetSerId);
	},
	sendToClientBySocket : function(socket,category,method,ret,packetId,data){
		var ts =  new Date().getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		socket.send(JSON.stringify(packet));
	},
	sendToClientErrBySocket : function(socket,errorId,errorInfo,packetId) {
		this.sendToClientBySocket(socket,'error','packageErr',errorId,packetId,{e:errorInfo});
	},
	
	doLogin : function(uid,userSession,packetId) {
		if (F.isset(this.userSocketManager.idClientMapping[uid])) {
			this.userSocketManager.idClientMapping[uid].kickUser();
		}

		//获取用户信息
		dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
			if (ret>0) {
				this.userSocketManager.idClientMapping[uid] = userSession;
				userSession.isLogined = true;
				userSession.id = uid;
				userSession.uid = uid;
				userSession.userInfo = data;
				userSession.onGetUserInfo();
				userSession.send("user","loginAck",1,packetId,data)
			} else {
				userSession.send("user","loginAck",ret,packetId,{e:"登录失败"})
			}
		}.bind(this));
	},
	rpc_login : function(typ,id,userSession,packetId) {
		logger.info("recv rpc login from ",typ+"/"+id);
		if (F.isset(this.rpcSocketManager.idClientMapping[typ+"/"+id])) {
			this.rpcSocketManager.idClientMapping[typ+"/"+id].kickUser("sameUser");
		}
		this.rpcSocketManager.idClientMapping[typ+"/"+id] = userSession;
		userSession.isLogined = true;
		userSession.id = typ+"/"+id;
		userSession.serverId = typ+"/"+id;
		userSession.send("user","loginAck",1,packetId,{});
	},
	rpc_ping : function(typ,id,userSession,packetId) {
		var ts =  new Date().getTime();
		userSession.lastPing = ts;
		userSession.send("rpc","pong",1,packetId,{t:ts});
	}
});

module.exports = BaseApp;