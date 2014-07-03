var config = module.exports;
if (process.env.NODE_ENV === undefined) {
	var PRODUCTION = "development";//"production";
} else {
	var PRODUCTION = process.env.NODE_ENV;
}

config.redis = {
	port: 27017,
	host: 'localhost'
};

config.mysql = {
	port: 3306,
	host: 'localhost',
	user: 'test',
	password: 'test',
	db: 'card'
};

config.upstreamUrl = {
	url:""
}

if (PRODUCTION==="production") {
	config.servers = {
	    "connector": [
	      	{"id": "connector-server-1", "host": "127.0.0.1", "port": 3150, "clientPort":3010},
	      	{"id": "connector-server-2", "host": "127.0.0.1", "port": 3151, "clientPort":3011, "frontend":true}
	    ],
	    "area": [
	      	{"id": "area-server-1", "host": "127.0.0.1", "port": 3250, "area": 1},
	      	{"id": "area-server-2", "host": "127.0.0.1", "port": 3251, "area": 2},
	      	{"id": "area-server-3", "host": "127.0.0.1", "port": 3252, "area": 3}
	    ],
	    "lobby":[
	     	{"id":"lobby-server-1","host":"127.0.0.1","port":3450}
	    ]
	};  
} else {
	config.servers = {
	    "lobby":{
	    	"runTyp":"nodejs",//nodejs 在本机启动,用于runner脚本
	    	"rpcMode":"lobby",
	    	"rpcProtocol":"websocket",
	    	"serverList" : {
	    		"lobby-server-1":{"id":"lobby-server-1","host":"127.0.0.1","port":3001,"clientPort":3000,"frontend":true}
	    	}
	    },
	    "upstream":{
	    	"runTyp":"web",//web 不再runner管理
	    	"rpcMode":"upstream",
	    	"rpcProtocol":"web",
	    	"serverList" : {
	    		"main":{"id":"main","url":"http://127.0.0.1"}
	    	}
	    	
	    },
	    "zha":{
	    	"runTyp":"nodejs",
	    	"rpcMode":"game",
	    	"rpcProtocol":"websocket",
	    	"indexMode": ["room","money"],//different server for different room
	    	"serverList" : {
	    		"zha-server-1":{"id":"zha-server-1","host":"127.0.0.1","port":3011,"clientPort":3010,"frontend":true,"indexParam":{"roomId":1,"minEntry":1000,"maxEntry":10000}}
	    	}
	    	
	    },
	    "yao":{
	    	"runTyp":"nodejs",
	    	"rpcMode":"game",
	    	"rpcProtocol":"websocket",
	    	"serverList" : {
	    		"yao-server-1":{"id":"yao-server-1","host":"127.0.0.1","port":3021,"clientPort":3020,"frontend":true}
	    	}
	    	
	    },
	    "robot":{
	    	"runTyp":"nodejs",
	    	"rpcMode":"robot",
	    	"rpcProtocol":"websocket",
	    	"serverList" : {
	    		"robot-server-1":{"id":"robot-server-1","host":"127.0.0.1","port":3031,"clientPort":3030,"frontend":false}
	    	}
	    	
	    },
	    "samples":{
	    	"runTyp":"rpc",//其他服务器上的应用, 不再runner管理,不关心是nodejs的还是c++的
	    	"rpcMode":"game",
	    	"rpcProtocol":"websocket",
	    	"serverList" : {
	    		"samples-server-1":{"id":"samples-server-1","host":"127.0.0.1","port":3031,"clientPort":3030,"frontend":false}
	    	}
	    	
	    },
	};
}
