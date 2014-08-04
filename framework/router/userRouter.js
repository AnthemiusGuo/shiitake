var UserRouter = Class.extend({
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
	}
});
module.exports = UserRouter;