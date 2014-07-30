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
		//如果初始化时候需要自己先读取数据库等才允许其他人rpc调用, 则不启动RPC接口
		this.serverInitReady = true;
		this.serverSocketListenReady = false;
		this.startTS = new Date().getTime();
		this.readyTS = 0;
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,0);
		this.globalTicket = F.md5(this.startTS+"sKlaa"+this.id);
		logger.info("this.globalTicket",this.globalTicket);
	},
	getErr : function(){
		return this.errorInfo;
	},
	setErr : function(msg){
		this.errorInfo = msg;
		logger.warn(this.id+"@"+this.typ+" : "+msg);
	},
	prepare : function() {
		utils.PLEASE_OVERWRITE_ME();
	},
	run : function() {
		//如果启动需要先读取数据库什么的, 就重写初始化时候把this.serverInitReady置为false,
		//这样定时执行等好了再说
		if (this.serverInitReady) {
			this.openSocketServer();
		}
		this.checkReadyTick = setInterval(this.checkStatus.bind(this),3000);
	},
	checkStatus : function() {
		if (this.serverInitReady && !this.serverSocketListenReady){
			logger.info("checkStatus rpc not ready");
			this.openSocketServer();
		}
		if (!this.serverInitReady) {
			logger.info("init not ready now!!");
			this.allReady = false;
			return;
		}
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
		utils.PLEASE_OVERWRITE_ME();
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
	},
	openRPCServer : function(){
		//对服务器RPC接口
		var serversInfo = this.info;
		global.backServer = new WebSocketServer({port: serversInfo.port});
		backServer.rpcClients = {};
		var ClientRPC = require('framework/base/rpcClient');
		backServer.on('connection', function(socket) {
		    logger.info('some server connected');

		    var clientSession = new ClientRPC(socket);
		    logicApp.rpcSocketManager.onNewSocketConnect(clientSession,socket);
		    socket.on('message', function(message) {
		        logicApp.onMsg("rpc",socket,message)
		    })
		    .on('close',function(code, message){
		        console.trace("===closed rpc client");
		        logicApp.rpcSocketManager.onCloseSocketConnect(socket);
		        clientSession.onCloseSocket();
		        clientSession = null;
		    });
		});
	},
	openUserServer : function(){
		var serversInfo = this.info;
		//支持对用户接入,监听用户端口
	    global.frontServer = new WebSocketServer({port: serversInfo.clientPort});
	    var ClientUser = require('app/apps/'+appTyp+'/client');
	    frontServer.userClients = {};

	    frontServer.on('connection', function(socket) {
	        logger.debug('someone connected');

	        var clientSession = new ClientUser(socket);
	        if (logicApp.allReady==false) {
	            clientSession.kickUser("serverNotReady");
	            return;
	        }
	        logicApp.userSocketManager.onNewSocketConnect(clientSession,socket);
	        socket.on('message', function(message) {
	            logger.trace(message);
	            logicApp.onMsg("user",socket,message)
	        })
	        .on('close',function(code, message){
	            logger.debug("===closed user client");
	            logicApp.userSocketManager.onCloseSocketConnect(socket);
	            clientSession.onCloseSocket();
	            clientSession = null;
	        });
	    });
	},
	openSocketServer : function(){
		global.WebSocketServer = require('ws').Server;
		//不用管是否执行完, 只要执行过了就好了
		this.serverSocketListenReady = true;
		var serversInfo = this.info;
		//先放在这里,将来移到run函数
		if (this.info.frontend) {
			this.openUserServer();
		}
		this.openRPCServer();
	}
});

module.exports = BaseApp;