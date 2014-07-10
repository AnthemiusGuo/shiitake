var RpcServer = require('framework/rpc/rpcServer');
var LobbyRPC = RpcServer.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;	
		for (var k in this.allServers) {
			this.allServers[k].ready = false;
		}
		this.allReady = false;
	},
	checkStatus : function() {
		var someOneNotReady = false;
		for (var k in this.allServers) {
			if (this.allServers[k].ready) {
				continue;
			}
			someOneNotReady = true;
		}
		if (someOneNotReady==false) {
			this.allReady = true;
		}
	},
	connect : function(){
		//依次执行各个categaory的注册, 使用配置的id作为请求的名字来自动路由到不同服务器
		for (var k in this.allServers) {
			this.allServers[k].ready = false;
			this.runCommand(k,"rpc_login",{},{typ:logicApp.typ,id:logicApp.id},this.onLoginAck.bind(this));
		}		
	},
	
	_buildReqUrl : function(InterfaceTyp, baseUrl,category,method,param){
		var paramInfo = "";
		if (typeof(param)!="undefined") {
			for (var k in param) {
				paramInfo = paramInfo+"&"+k+"="+param[k];
			};
		}
		if (InterfaceTyp=="ma") {
			return baseUrl+"?m="+category+"&a="+method+paramInfo;
		}
	},

	runCommand : function(category,method,id,params,cb){
		logger.debug("websocket","runCommand",category,method,id,params);

		this.requestId++;
		var reqId = this.requestId;
		this.requestQueue[reqId] = {reqId:reqId,category:category,method:method,id:id,params:params};

		//寻找服务器
		if (!F.isset(this.allServers[category])) {
			var thisServer = this.allServers.main;
		} else {
			var thisServer = this.allServers[category];
		}

		if (method!= "rpc_login" && method!="ping") {
			if (thisServer.ready==false) {
				cb(-999,"服务器尚未准备好",self.requestQueue[reqId]);
				self.requestQueue[reqId] = null;
  				return;
			}
		}

		if (thisServer.paramTyp=="POST") {
			var url = this._buildReqUrl(thisServer.interfaceTyp,thisServer.url,
				category,method);
			logger.trace("req web: http://"+thisServer.host+url);
			this.sendHttpPost(reqId,thisServer.host,url,params,cb);
		} else {
			var url = this._buildReqUrl(thisServer.interfaceTyp,thisServer.url,
				category,method,params);
			logger.trace("req web:"+url);
			this.sendHttpGet(reqId,thisServer.host,url,cb);
		}
		
	},

	sendHttpPost : function(reqId,host,url,reqData,cb){
		
		var http = require('http');
		var post_data = "data="+JSON.stringify(reqData);
		var options = {
		    host: host,
		    path: url,
		    method: 'POST',
		    headers:{
			  	'Content-Type':'application/x-www-form-urlencoded',
			  	'Content-Length':post_data.length
		    },
		    agent:false
		};
		var self = this;
		var req = http.request(options, function(res) {
			logger.trace('STATUS: ' + res.statusCode);
  			if (res.statusCode!=200) {
  				cb(0-res.statusCode,JSON.stringify(res.headers),self.requestQueue[reqId]);
  				return;
  			}
		    res.setEncoding('utf8');
		    var total_data = '';
		    res.on('data', function(data) {
		    	total_data += data;
		    }).on('end',function(){
		    	try {
		    		logger.trace("web return:",total_data);
		    		var data = JSON.parse(total_data);
		    		if (cb==undefined) {
		    			self.onMsgAck(1,data,self.requestQueue[reqId]);
		    		} else {
		    			cb(1,data,self.requestQueue[reqId]);
		    		}
		    		self.requestQueue[reqId] = null;
		    	} 
		    	catch(err){
		    		if (cb==undefined) {
		    			self.onMsgAck(-1,err,self.requestQueue[reqId]);
		    		} else {
		    			cb(-1,err,self.requestQueue[reqId]);
		    		}
		    		self.requestQueue[reqId] = null;
		    	}
		    	
		    });
		});
		req.write(post_data);
		req.end();
	},
	sendHttpGet : function(reqId,host,url,cb){
		var http = require('http');

		var options = {
		    host: host,
		    path: url,
		    method: 'GET',
		    headers: {
		        'Accept': 'text/html'
		    },
		    agent:false
		};
		logger.trace('fetching '+url);
		var req = http.request(options, function(res) {
		    res.setEncoding('utf8');
		    var total_data = '';
		    res.on('data', function(data) {
		    	total_data += data;
		    }).on('end',function(){
		    	try {
		    		var data = JSON.parse(total_data);
		    		cb(data);
		    	} 
		    	catch(err){
		    		logger.error(err);
		    	}
		    	
		    });
		});
		req.end();
	},
	ping : function(){
		//依次执行各个categaory的ping, 使用配置的id作为请求的名字来自动路由到不同服务器
		for (var k in this.allServers) {
			this.allServers[k].ready = false;
			this.runCommand(k,"ping",{},{typ:logicApp.typ,id:logicApp.id},this.onPong.bind(this));
		}
	},
	onMsgAck: function(ret,data,req) {
		logger.trace("unkown package!",ret,req,data);
	},
	onLoginAck: function(ret,data,req) {

		if (ret>0) {
			this.allServers[req.category].ready = true;
			this.pingTick = setInterval(this.ping.bind(this),300000);
			logger.info("upstream server "+req.category+" ready!!!");
			this.checkStatus();
		} else {
			logger.error("connect upstream server failed for "+req.category+"/"+req.method);
			logger.error("error code "+ret);
		}
	},
	onPong : function(ret,data,req) {
		if (ret>0) {

		} else {
			this.allServers[req.category].ready = false;
		}
	}

});
module.exports = LobbyRPC;