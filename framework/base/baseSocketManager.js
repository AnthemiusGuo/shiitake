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
	},
	initPackageRouter: function(category){
		if (!F.isset(this.packageRouter[category])) {
			var dir = 'app/controllers/'+this.rpcOrClient+'/'+this.typ+'/'+category;
			if (utils.lookup(rootDir,dir)) {
				var Category = require(dir);				
			} else {
				dir = 'app/controllers/'+this.rpcOrClient+'/base/'+category;
				if (utils.lookup(rootDir,dir)) {
					var Category = require(dir);				
				} else {
					return -9998;
					
				}
			}
			logger.info("final dir:"+dir);
			this.packageRouter[category] = new Category(this.app);
		}
		return 1;
	},
	onNewSocketConnect : function(user,socket) {
		this.socketClientMapping[socket] = user;
		this.connectCount++;
	},
	
	onCloseSocketConnect : function(socket) {
		if (!F.isset(this.socketClientMapping[socket])) {
			return;
		}
		if (this.socketClientMapping[socket].isLogined) {
			var id = this.socketClientMapping[socket].id;
			this.idClientMapping[id] = null;
		}
		this.socketClientMapping[socket] = null;
		this.connectCount--;
	},

});

module.exports = BaseSocketManager;