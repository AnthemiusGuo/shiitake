var BaseServer = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
		this.errorInfo = "";
		this.socketUserMapping = {};
		this.uidUserMapping = {};
		this.uidSocketMapping = {};
	},
	getErr : function(){
		return this.errorInfo;
	},
	setErr : function(msg){
		this.errorInfo = msg;
		console.log(this.id+"@"+this.typ+" : "+msg);
	},
	run : function() {
		
	},
	newUserSocketConnect : function(user,socket) {
		this.socketUserMapping[socket] = user;
	},
	closeUserSocketConnect : function(socket) {
		if (this.socketUserMapping[socket].isLogined) {
			var uid = this.socketUserMapping[socket].uid;
			this.uidUserMapping[uid] = null;
			this.uidSocketMapping[uid] = null;
		}
		this.socketUserMapping[socket] = null;
	},
	onClientMsg : function(socket,msg) {
		var package = JSON.parse(msg);
		if (!isset(package.c) || package.m==undefined || package.d==undefined || package.t==undefined || package.s==undefined || package.r==undefined) {
			var packetSerId = package.s;
			this.replyErrBySocket(socket,-9999,"信令格式有误",packetSerId);
			return;
		}
		var packetSerId = package.s;
		
		
	},
	sendToClientBySocket : function(socket,category,method,ret,packetId,data) {
		var ts =  new Date().getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		socket.send(JSON.stringify(packet));
	},
	sendToClientErrBySocket : function(socket,errorId,errorInfo,packetId) {
		this.sendToClientBySocket(socket,'error','packageErr',errorId,packetId,errorInfo);
	}
});

module.exports = BaseServer;