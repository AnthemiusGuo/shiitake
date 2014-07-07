var RpcServer = require('app/base/rpc/rpcServer');
var LobbyRPC = RpcServer.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;	
	},
	connect : function(){
		for (var k in this.allServers) {
			this.runCommnd("rpc","login",{},{typ:logicApp.typ,id:logicApp.id},this.onLoginAck.bind(this));
		}
	},
	onMsgAck: function(data,req) {
		logger.debug("unkown package!",data);
	},
	onLoginAck: function(data,req) {
		if (data.ret==1) {

		} else {
			logger.error("connect upstream server failed for ")
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

	runCommnd : function(category,method,id,params,cb){
		this.requestId++;
		var reqId = this.requestId;
		this.requestQueue[reqId] = {reqId:reqId,category:category,method:method,id:id,params:params};

		if (!F.isset(this.allServers[category])) {
			var thisServer = this.allServers.main;
		} else {
			var thisServer = this.allServers[category];
		}

		if (thisServer.paramTyp=="POST") {
			var url = this._buildReqUrl(thisServer.interfaceTyp,thisServer.url,
				category,method);
			logger.debug("req web:"+url);
			this.sendHttpPost(reqId,thisServer.host,url,params,cb);
		} else {
			var url = this._buildReqUrl(thisServer.interfaceTyp,thisServer.url,
				category,method,params);
			logger.debug("req web:"+url);
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
		var req = http.request(options, function(res) {
			logger.debug('STATUS: ' + res.statusCode);
  			logger.debug('HEADERS: ' + JSON.stringify(res.headers));
  			if (res.statusCode!=200) {
  				cb(-1,err,this.requestQueue[reqId]);
  			}
		    res.setEncoding('utf8');
		    var total_data = '';
		    res.on('data', function(data) {
		    	total_data += data;
		    }).on('end',function(){
		    	try {
		    		logger.debug(total_data);
		    		var data = JSON.parse(total_data);
		    		if (cb==undefined) {
		    			this.onMsgAck(1,data,this.requestQueue[reqId]);
		    		} else {
		    			cb(1,data,this.requestQueue[reqId]);
		    		}
		    		this.requestQueue[reqId] = null;
		    	} 
		    	catch(err){
		    		if (cb==undefined) {
		    			this.onMsgAck(-1,err,this.requestQueue[reqId]);
		    		} else {
		    			cb(-1,err,this.requestQueue[reqId]);
		    		}
		    		this.requestQueue[reqId] = null;
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
		console.log('fetching '+url);
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
	}

});
module.exports = LobbyRPC;