var BaseServer = require('framework/base/baseApp');
//机器人为请求式, 加入等请求为游戏发起, 机器人设置不同类型
var RobotServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.for = info.for;
		this.robotPool = [];
		this.robotInfos = {};
		this.robotCount = 0;
		this.robotInUseCount = 0;
		this.serverInitReady = false;
		var dir = 'app/apps/'+this.for+'/robot';
		if (utils.lookup(rootDir,dir)) {
			global.Robot = require(dir);				
		} else {
			dir = 'app/apps/robot/baseRobot';
			global.Robot = require(dir);
		}
	},
	prepare : function() {
		//它注册别人RPC和自己的机器人无关, 但是处理别人的RPC login时候,需要重载下, 必须自己服务器初始化完成了才允许其他rpc调用接入
		//读取数据库, 初始化自己的机器人库
		//从数据库获得
		//机器人列表本身没必要redis化, 因为服务器启动时所有数据载入内存, 后期发现内存占用比较大再切换为redis也可以.
		var sql = "SELECT * from s_robot WHERE forTyp = '"+this.for+"'";
		var self = this;

		db.query(sql, function(err, rows, fields) {
    		if (err) {
    			logger.error("DB ERR FOR ROBOT!!!");
    			process.exit();
    			return;
    		}
    		if (rows.length==0) {
    			self.robotCount = 0;
    			self.robotInUseCount = 0;
    			self.createNewRobots(10);
    			return;
    		}
    		async.every(rows, function(data,callback){
    			var uid = data.uid;
    			dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
                    logger.debug("getInfo result",ret);
                    if (ret>0) {
                    	self.addRobot(uid,data);
                        callback(true);
                    } else {
                    	logger.error("DB ERR no user info in db for robot ",uid);
                    	callback(false);
                    }
                });
    		}, function(result){
    			if (result) {
    				this.serverInitReady = true;	
    			} else {
    				logger.error("DB ERR FOR ROBOT!!!");
    				process.exit();
    			}
			});
    	});
	},
	addRobot : function(uid,data) {
    	this.robotInfos[uid] = new Robot(this.for,uid);
    	this.robotInfos[uid].setInfo(data);
    	this.robotPool.push(uid);
    	this.robotCount++;
	},
	createNewRobots : function(count) {
		//创建机器人, TODO
	}
});
module.exports = RobotServer;