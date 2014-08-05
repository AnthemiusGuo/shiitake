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
	db: 'card_game'
};

config.upstreamUrl = {
	url:""
}

config.gameIdToServer = {
	1 : "zha",
	2 : "yao"
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
		//大厅
	    "lobby":{
	    	"runTyp":"nodejs",//nodejs 在本机启动,用于runner脚本
	    	"rpcMode":"lobby",
	    	"rpcProtocol":"websocket",
	    	"rpcMustConnect" : true,
	    	"serverList" : {
	    		"lobby-server-1":{"id":"lobby-server-1","host":"127.0.0.1","port":3001,"clientPort":3000,"frontend":true}
	    	}
	    },
	    //事件驱动引擎
	    // "eDriver":{
	    // 	"runTyp":"nodejs",//nodejs 在本机启动,用于runner脚本
	    // 	"rpcMode":"eDriver",
	    // 	"rpcProtocol":"websocket",
	    // 	"rpcMustConnect" : true,
	    // 	"serverList" : {
	    // 		"eDriver-main":{"id":"eDriver-main","host":"127.0.0.1","port":3901,"frontend":false}
	    // 	}
	    // },
	    "upstream":{
	    	"runTyp":"web",//web 不再runner管理
	    	"rpcMode":"upstream",
	    	"rpcProtocol":"web",
	    	"rpcMustConnect" : true,
	    	"serverList" : {
	    		//id 字段, 如果信令category命中id字段则使用这个字段的服务器,否则都用main服务器
	    		//不可重复,该功能不应该支持负载均衡,如果要负载均衡在web端实现
	    		//interfaceTyp:ma, method,action模式,
	    		//ciquery,CI框架query模式
	    		// "main":{"id":"main","host":"127.0.0.1","url":"/yet-another-mcard-game/card/server/server.php",paramTyp:"POST",interfaceTyp:"ma"}
	    		"main":{"id":"main","host":"127.0.0.1","url":"/shiitake/shiitake/web_demo/server.php",paramTyp:"POST",interfaceTyp:"ma"}
	    	}
	    	
	    },
	    "zha":{
	    	"runTyp":"nodejs",
	    	"rpcMode":"game",
	    	"rpcProtocol":"websocket",
	    	"rpcMustConnect" : false,
	    	"indexMode": ["room","money"],//different server for different room
	    	"serverList" : {
	    		// "zha-srv-1-1":{"id":"zha-srv-1-1","host":"127.0.0.1","port":3011,"clientPort":3010,"frontend":true,"indexParam":{"roomId":1,"minEntry":1000,"maxEntry":10000}}
	    		//cap:容量，对于本类型游戏，容量就是桌子数，开了几张桌子
	    		"zha-srv-1-1":{"id":"zha-srv-1-1","host":"127.0.0.1","port":3011,"frontend":false,"cap":50,"roomId":10}
	    	},
	    },
	    // "yao":{
	    // 	"runTyp":"nodejs",
	    // 	"rpcMode":"game",
	    // 	"rpcProtocol":"websocket",
	    // 	"serverList" : {
	    // 		"yao-server-1":{"id":"yao-server-1","host":"127.0.0.1","port":3021,"clientPort":3020,"frontend":true}
	    // 	}
	    	
	    // },
	    "robot":{
	    	"runTyp":"nodejs",
	    	"rpcMode":"robot",
	    	"rpcProtocol":"websocket",
	    	"serverList" : {
	    	//for关键字
	    		"robot-server-zha":{"id":"robot-server-zha","host":"127.0.0.1","port":3031,"clientPort":3030,"frontend":false,"for":"zha"}
	    	}
	    	
	    },
	    // "samples":{
	    // 	"runTyp":"rpc",//其他服务器上的应用, 不再runner管理,不关心是nodejs的还是c++的
	    // 	"rpcMode":"game",
	    // 	"rpcProtocol":"websocket",
	    // 	"serverList" : {
	    // 		"samples-server-1":{"id":"samples-server-1","host":"127.0.0.1","port":3031,"clientPort":3030,"frontend":false}
	    // 	}
	    	
	    // },
	    "samples2":{
	    	"runTyp":"nodejs",
	    	"rpcMode":"game",
	    	"rpcProtocol":"none",//无RPC调用提供
	    	"serverList" : {
	    		"samples2-server-1":{"id":"samples2-server-1","host":"127.0.0.1","clientPort":3030,"frontend":true}
	    	}
	    	
	    },
	};
}
