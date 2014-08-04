var BaseSocketManager = Class.extend({
	init : function(app,rpcOrClient,typ) {
		this.app = app;
		this.typ = typ;
		this.rpcOrClient = rpcOrClient;
		this.packageRouter = {};

		this.socketClientMapping = {};
		this.idClientMapping = {};
		
		this.connectCount = 0;
		this.loginedCount = 0;

		this.initPackageRouter();
	},
	initPackageRouter: function(){
		logger.info("app/apps/"+this.typ+"/"+this.rpcOrClient+"Router");
		var PackageRouter = require("app/apps/"+this.typ+"/"+this.rpcOrClient+"Router");
		logger.info(PackageRouter);
		this.packageRouter = new PackageRouter(this.typ,this.app);
	},
	onNewSocketConnect : function(clientSession,socket) {

		this.socketClientMapping[socket.socket_id] = clientSession;
		this.connectCount++;
	},
	
	onCloseSocketConnect : function(socket) {
		if (!F.isset(this.socketClientMapping[socket.socket_id])) {
			return;
		}
		if (this.socketClientMapping[socket.socket_id].isLogined) {
			var id = this.socketClientMapping[socket.socket_id].id;
			this.idClientMapping[id] = null;
		}
		this.socketClientMapping[socket.socket_id] = null;
		this.connectCount--;
	},
	onRecv: function(clientSession,message) {
		var package = JSON.parse(message);
		if (!F.isset(package.c) || !F.isset(package.m) || !F.isset(package.d) || !F.isset(package.t) || !F.isset(package.s) || !F.isset(package.r)) {
			var packetSerId = package.s;
			clientSession.sendErr(-9999,"信令格式有误",packetSerId);
			return;
		}

		this.packageRouter.onRecv(clientSession,package);
	}

});

module.exports = BaseSocketManager;