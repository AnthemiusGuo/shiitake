var BaseSocketManager = require("framework/base/baseSocketManager");
var BaseApp = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
		this.errorInfo = "";

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

		this.checkReadyTick = null;
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
	genLoadBalance : function() {
		utils.PLEASE_OVERWRITE_ME();
		return 0;
	},
	run : function() {
		//如果启动需要先读取数据库什么的, 就重写初始化时候把this.serverInitReady置为false,
		//这样定时执行等好了再说
		if (this.serverInitReady) {
			this.openSocketServer();
		}
		if (this.checkReadyTick ==null) {
			this.checkReadyTick = setInterval(this.checkStatus.bind(this),3000);
		}
		
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

		this.allReady = true;
		clearInterval(this.checkReadyTick);
		this.checkReadyTick = null;
		logger.info("All server Ready!!");

		if (this.firstAllReady==false) {
			this.firstAllReady = true;
			this.onAllReady();
		} else {
			this.onReReady();
		}
	},
	onAllReady : function() {
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,1);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"startTS",this.startTS);
		clearInterval(this.checkReadyTick);
		this.checkReadyTick = null;

	},
	onReReady : function() {
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,1);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);
		clearInterval(this.checkReadyTick);
		this.checkReadyTick = null;
	},
	onPause : function(reason) {
		//故障暂停，
		this.allReady = false;
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,2);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);
		
		logger.info("server onPause by reason ",reason);
		if (this.checkReadyTick ==null) {
			this.checkReadyTick = setInterval(this.checkStatus.bind(this),3000);
		}
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
		if (F.isset(config.GAME_IDS[typ])) {
			userSession.gameId = config.GAME_IDS[typ];
		}
		userSession.send("rpc","loginAck",1,packetId,{});
	},
	rpc_ping : function(typ,id,data) {
		//Nothing to do, for some typ app, should use this to check server online info
	},
	openRPCServer : function(){
		//对服务器RPC接口

		this.rpcSocketManager = new BaseSocketManager(this,"rpc",this.typ);
		var serversInfo = this.info;
		global.backServer = new WebSocketServer({port: serversInfo.port});
		backServer.rpcClients = {};
		this._rpc_sock_id = 0;
		var ClientRPC = require('framework/base/rpcClient');
		backServer.on('connection', function(socket) {
		    logger.info('some server connected');
		    this._rpc_sock_id ++;
	        var ts = new Date().getTime();
	        socket.socket_id = F.md5(this._rpc_sock_id+"es"+ts);

		    var clientSession = new ClientRPC(socket);
		    logicApp.rpcSocketManager.onNewSocketConnect(clientSession,socket);

		    socket.on('message', function(message) {
		        logicApp.rpcSocketManager.onRecv(clientSession,message)
		    })
		    .on('close',function(code, message){
		        logger.info("===closed rpc client");
		        logicApp.rpcSocketManager.onCloseSocketConnect(socket);		        
		        clientSession.onCloseSocket();
		        clientSession = null;
		    });
		});
	},
	openUserServer : function(){

		this.userSocketManager = new BaseSocketManager(this,"user",this.typ);
		var serversInfo = this.info;
		//支持对用户接入,监听用户端口
	    global.frontServer = new WebSocketServer({port: serversInfo.clientPort});
	    var ClientUser = require('app/apps/'+appTyp+'/client');
	    frontServer.userClients = {};
	    this._user_sock_id = 0;
	    frontServer.on('connection', function(socket) {
	        logger.debug('someone connected');
	        this._user_sock_id ++;
	        var ts = new Date().getTime();
	        socket.socket_id = F.md5(this._user_sock_id+"sd"+ts);
	        var clientSession = new ClientUser(socket);
	        if (logicApp.allReady==false) {
	            clientSession.kickUser("serverNotReady");
	            return;
	        }
	        logicApp.userSocketManager.onNewSocketConnect(clientSession,socket);
	        socket.on('message', function(message) {
	            logicApp.userSocketManager.onRecv(clientSession,message)
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