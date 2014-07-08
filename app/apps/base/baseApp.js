var path = require('path');
var fs = require('fs');
var dirname = path.dirname;
var basename = path.basename;
var extname = path.extname;
var exists = fs.existsSync || path.existsSync;
var join = path.join;


var BaseServer = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
		this.errorInfo = "";

		this.packageClientRouter = {};
		this.packageRPCRouter = {};

		this.socketUserMapping = {};
		this.uidClientMapping = {};
		
		this.socketRPCMapping = {};
		this.serverIdClientMapping = {};

		this.connectUserCount = 0;
		this.loginedUserCount = 0;

		this.connectRPCCount = 0;
		this.loginedRPCCount = 0;
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
	onNewUserSocketConnect : function(user,socket) {
		this.socketUserMapping[socket] = user;
		this.connectUserCount++;
	},
	onNewRPCSocketConnect : function(user,socket) {
		this.socketRPCMapping[socket] = user;
		this.connectRPCCount++;
	},
	onCloseUserSocketConnect : function(socket) {
		if (this.socketUserMapping[socket].isLogined) {
			var uid = this.socketUserMapping[socket].uid;
			this.uidClientMapping[uid] = null;
		}
		this.socketUserMapping[socket] = null;
		this.connectUserCount--;
	},
	onCloseRPCSocketConnect : function(socket) {
		if (this.socketRPCMapping[socket].isLogined) {
			var serverId = this.socketRPCMapping[socket].serverId;
			this.serverIdClientMapping[serverId] = null;
			this.loginedRPCCount--;
		}
		this.socketRPCMapping[socket] = null;
		this.connectRPCCount--;
	},
	onClientMsg : function(socket,msg) {
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
		if (!F.isset(this.packageClientRouter[category])) {
			if (this.lookup('app/controllers/client/'+this.typ+'/'+category)) {
				var Category = require('app/controllers/client/'+this.typ+'/'+category);				
			} else {
				if (this.lookup('app/controllers/client/base/'+category)) {
					var Category = require('app/controllers/client/base/'+category);				
				} else {
					this.sendToClientErrBySocket(socket,-9998,"信令不存在",packetSerId);
					return;
				}
			}
			this.packageClientRouter[category] = new Category(this);
		}
		if (!F.isset(this.packageClientRouter[category][method])) {
			this.sendToClientErrBySocket(socket,-9997,"信令不存在",packetSerId);
			return;
		}
		if (!F.isset(this.socketUserMapping[socket])) {
			this.sendToClientErrBySocket(socket,-9996,"Session丢失",packetSerId);
			return;
		}
		var userSession = this.socketUserMapping[socket];

		this.packageClientRouter[category][method](userSession,ret,ts,data,packetSerId);
	},
	onRPCMsg : function(socket,msg) {
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
		if (!F.isset(this.packageRPCRouter[category])) {
			if (this.lookup('app/controllers/rpc/'+this.typ+'/'+category)) {
				var Category = require('app/controllers/rpc/'+this.typ+'/'+category);				
			} else {
				if (this.lookup('app/controllers/rpc/base/'+category)) {
					var Category = require('app/controllers/rpc/base/'+category);				
				} else {
					this.sendToClientErrBySocket(socket,-9998,"信令不存在",packetSerId);
					return;
				}
			}
			this.packageRPCRouter[category] = new Category(this);
		}
		if (!F.isset(this.packageRPCRouter[category][method])) {
			this.sendToClientErrBySocket(socket,-9997,"信令不存在",packetSerId);
			return;
		}
		if (!F.isset(this.socketRPCMapping[socket])) {
			this.sendToClientErrBySocket(socket,-9996,"Session丢失",packetSerId);
			return;
		}
		var userSession = this.socketRPCMapping[socket];

		this.packageRPCRouter[category][method](userSession,ret,ts,data,packetSerId);
	},
	sendToClientBySocket : function(socket,category,method,ret,packetId,data){
		var ts =  new Date().getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		socket.send(JSON.stringify(packet));
	},
	sendToClientErrBySocket : function(socket,errorId,errorInfo,packetId) {
		this.sendToClientBySocket(socket,'error','packageErr',errorId,packetId,{e:errorInfo});
	},
	lookup : function(path){
		if (!utils.isAbsolute(path)) {
			path = join(rootDir, path);
		}
		logger.debug("checking path for: "+path);
		if (exists(path)) {
			return true;
		} 
		path = path+".js";
		logger.debug("checking path for: "+path);
		
		if (exists(path)) {
			return true;
		} else {
			return false;
		}
	},
	login : function(uid,userSession,packetId) {
		if (F.isset(this.uidClientMapping[uid])) {
			this.uidClientMapping[uid].kickUser();
		}

		//获取用户信息
		dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
			if (ret>0) {
				this.uidClientMapping[uid] = userSession;
				userSession.isLogined = true;
				userSession.uid = uid;
				userSession.userInfo = data;
				userSession.send("user","login",1,packetId,data)
			} else {
				userSession.send("user","login",ret,packetId,{e:"登录失败"})
			}
		}.bind(this));

		//剩下的行为子类实现
	},
	rpc_login : function(typ,id,userSession,packetId) {
		if (F.isset(this.serverIdClientMapping[typ+"/"+id])) {
			this.serverIdClientMapping[typ+"/"+id].kickUser();
		}
		this.serverIdClientMapping[typ+"/"+id] = userSession;
		userSession.isLogined = true;
		userSession.serverId = typ+"/"+id;
		userSession.send("user","login",1,packetId,{});
	}
});

module.exports = BaseServer;