var RpcServer = require('framework/rpc/rpcServer');
var WebSocketRPC = RpcServer.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;	
		for (var k in this.allServers) {
			this.allServers[k].connected = false;
			this.allServers[k].ready = false;
		}
		this.connectTick = 0;
		this.allReady = false;
	},
	realConnect : function() {
		
		//依次执行各个categaory的注册, 使用配置的id作为请求的名字来自动路由到不同服务器
		var someOneNotReady = false;
		for (var k in this.allServers) {
			if (this.allServers[k].ready) {
				continue;
			}
			someOneNotReady = true;
			if (this.allServers[k].connected == false) {
				this.doConnect(k);
			} else {
				this.runCommand("rpc","login",{serverId:this.allServers[k].id},{typ:logicApp.typ,id:logicApp.id},this.onLoginAck.bind(this));
			}
			// this.runCommand(k,"rpc_login",{},{typ:logicApp.typ,id:logicApp.id},this.onLoginAck.bind(this));
		}
		if (someOneNotReady==false) {
			clearInterval(this.connectTick);
			this.allReady = true;
		}
	},
	doConnect : function(k) {
		logger.info("try to connect to rpc server:"+this.typ,this.allServers[k].id);
		//"lobby-server-1":{"id":"lobby-server-1","host":"127.0.0.1","port":3001,"clientPort":3000,"frontend":true}
		if (this.allServers[k].connected) {
			return;
		}
		this.allServers[k].socket = null;
		var WebSocketClient = require('ws');
		var self = this;
		try {
			var thisServer = this.allServers[k];
			this.allServers[k].socket = new WebSocketClient('ws://'+thisServer.host+':'+thisServer.port);

			thisServer.socket.on('open', function() {
				logger.info("websocket server "+self.typ+"/"+thisServer.id+" connect!!!");
				self.allServers[k].connected = true;
				self.runCommand("rpc","login",{serverId:thisServer.id},{typ:logicApp.typ,id:logicApp.id,serverId:thisServer.id},self.onLoginAck.bind(self));
			    
			}).on('message', function(data, flags) {
				logger.trace(data);
			    var msg = JSON.parse(data);
			    var reqId = msg.s;
			    if (F.isset(self.requestQueue[reqId])) {
			    	//{'c':category,'m':method,'d':data,'t':ts,'s':reqId,'r':0};
			    	self.requestQueue[reqId].cb(msg.r,msg.d,self.requestQueue[reqId]);
			    	clearTimeout(self.requestQueue[reqId].timeoutTick);
			    	self.requestQueue[reqId].timeoutTick = null;
			    	self.requestQueue[reqId] = null;
			    } else {
			    	self.onMsgAck(msg.r,msg.d,msg);
			    }
			}).on('close',function(){
				self.allServers[k].connected = false;
				self.allServers[k].ready = false;
			}).on('error',function(err){
				self.allServers[k].connected = false;
				self.allServers[k].ready = false;
				logger.error(err);
			});
		} catch(err) {
			this.allServers[k].connected = false;
		}
		
	},
	connect : function(){
		if (F.isset(this.connectTick)) {
			clearInterval(this.connectTick);			
		}
		this.connectTick = setInterval(this.realConnect.bind(this),3000);

	},
	findServer : function(id) {
		if (F.isset(id.serverId)) {
			if (F.isset(this.allServers[id.serverId])) {
				return this.allServers[id.serverId];
			}
		} else {

		}
		return null;
	},
	errorOnSend : function(ret,errorInfo,req){
		logger.error(ret,errorInfo,req);
	},
	runCommand : function(category,method,id,data,cb){
		logger.debug("websocket","runCommand",category,method,id,data);
		this.requestId++;
		var reqId = this.requestId;
		var req = {reqId:reqId,category:category,method:method,id:id,params:data,cb:cb};
		if (F.isset(cb)) {
			this.requestQueue[reqId] = req;
		} else {
			cb = this.errorOnSend;
		}
		
		//寻找服务器
		var thisServer = this.findServer(id);
		if (thisServer==null) {
			cb(-1001,"没有找到合适的服务器路由",req);
			return;
		}
		if (thisServer.connected==false){
			cb(-1000,"服务器尚未链接",req);
			return;
		}
		if (method!= "login" && method!="ping") {
			if (thisServer.ready==false) {
				cb(-999,"服务器尚未准备好",req);
				self.requestQueue[reqId] = null;
  				return;
			}
		}
		var ts =  new Date().getTime();
		var package = {'c':category,'m':method,'d':data,'t':ts,'s':reqId,'r':0};
		thisServer.socket.send(JSON.stringify(package), function(error) {
    		// if error is null, the send has been completed,
    		// otherwise the error object will indicate what failed.
    		if (error!=null) {
    			cb(-998,"服务器发送失败",req);
				self.requestQueue[reqId] = null;
  				return;
    		}
		});
		if (F.isset(this.requestQueue[reqId])) {
			var self = this;
			req.timeoutTick = setTimeout(function(){
				self.onReqTimeout(reqId)
			},1000);
		}
	},

	
	ping : function(){
		//依次执行各个categaory的ping, 使用配置的id作为请求的名字来自动路由到不同服务器
		for (var k in this.allServers) {
			this.runCommand("rpc","ping",{serverId:this.allServers[k].id},{typ:logicApp.typ,id:logicApp.id,serverId:this.allServers[k].id},this.onPong.bind(this));
		}
	},
	onReqTimeout : function(reqId){
		var req = this.requestQueue[reqId];
		req.cb(-998,"超时没有返回",req);
		req.timeoutTick = null;
		this.requestQueue[reqId] = null;
	},
	onMsgAck: function(ret,data,req) {
		logger.debug("unkown package!",ret,req,data);
	},
	onLoginAck: function(ret,data,req) {

		if (ret>0) {
			var id = req.params.serverId;
			logger.info("websocket server "+this.typ+"/"+id+" ready!!!");
			this.allServers[id].ready = true;
			setTimeout(this.ping.bind(this),300000);
		} else {
			logger.error("login socket rpc server failed for "+req.params.typ+"/"+req.params.id);
			logger.error("error code "+ret);
		}
	},
	onPong : function(ret,data,req) {
		var id = req.params.serverId;
		if (ret>0) {
			
		} else {
			this.allServers[id].ready = false;
		}
	}
});
module.exports = WebSocketRPC;