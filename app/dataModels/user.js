var BaseDM = require('framework/base/baseDM');
var UserDM = BaseDM.extend({
	init : function() {
		this._super();
		this.cacheCategory = "user";
		this.cacheTyp = {
			baseInfo : "hash"
		};
		
		this.CACHE_EXPIRE = 3600;
	},
	getBaseInfo:function(param,cb){
		//参数只有uid，

		// var sql = utils.supplant('SELECT * FROM u_account WHERE uid={uid}',param);
		var cacheMethod = "baseInfo";
		var id = param.uid;
		var self = this;

		async.waterfall([
            function getCacheHash(callback) {
            	//先找cache
            	logger.debug("getCacheHash");
				var real_key = self.getCacheKey(cacheMethod,id);
				logger.debug(real_key);
				kvdb.hgetall(real_key, function(err, reply) {
				    if (err) {
				    	callback(-2,err);
				    	return;
				    }
				    if (reply===null) {
				    	callback(null);
				    	return;
				    }
				    //hit cache!!!
				    self.setData(cacheMethod,id,reply);
				    logger.debug(cacheMethod,id,"hit cache!!!");
				    callback(1,reply);
				});
            },
            function getDB(callback){
            	//然后找mongo
            	logger.debug("get from DB");
            	
            	var collection = db.collection('user');
            	collection.findOne({_id:new ObjectId(id)}, function(err, item) {

            		
            	});
                db.query(sql, function(err, rows, fields) {
		    		if (err) {
		    			callback(-2,err);
		    			return;
		    		}
		    		if (rows.length==0) {
		    			callback(-1);
		    			return;
		    		}
		    		var info = rows[0];
		    		self.setData(cacheMethod,id,info);
		    		// logger.debug("db get user",userInfo);
		    		self.setCacheHash(cacheMethod,id,info);
		    		callback(2,info);
		    	});
            }
       //      function getDB(callback){
       //      	logger.debug("getDB");
       //          db.query(sql, function(err, rows, fields) {
		    	// 	if (err) {
		    	// 		callback(-2,err);
		    	// 		return;
		    	// 	}
		    	// 	if (rows.length==0) {
		    	// 		callback(-1);
		    	// 		return;
		    	// 	}
		    	// 	var info = rows[0];
		    	// 	self.setData(cacheMethod,id,info);
		    	// 	// logger.debug("db get user",userInfo);
		    	// 	self.setCacheHash(cacheMethod,id,info);
		    	// 	callback(2,info);
		    	// });
       //      }
        ], function doneAll (err, result) {
            if (err && err<=0) {
                logger.error("doneAll with err",err,result);
                cb(err,result);
            } else {
            	cb(1,result);
            }
            
        });	
	}
		
	},
	setBaseInfo:function(key,data,cb){
		//同下, 方案2
		var sql_plus_a = [];
		for (var k in data) {
			sql_plus_a.push(k+"=\""+F.add_slashes(data[k])+"\"");
		};
		key.sql_plus = sql_plus_a.join(",");
		var sql = utils.supplant('UPDATE u_account SET {sql_plus} WHERE uid={uid}',key);
		logger.debug(sql);
		var id = key.uid;
		var self = this;
		var method = "baseInfo";


		this.getBaseInfo(key,function(){
			logger.info(self.data);
			var sourceData = self.data[self.cacheCategory][method][id];
			var targetData = {};
			
			for (var k in data) {
				//cache取出的都是字符串,切记!!!!
				targetData[k] =  data[k];
			};
			logger.debug(targetData);
			var real_key = self.getCacheKey(method,id);
			async.parallel([
			    function setCache(callback){
			    	logger.debug("setCache",real_key,targetData);
			    	kvdb.hmset(real_key, targetData,function(err, res) {
			    		logger.debug("setCache done",err);
						kvdb.expire(real_key,self.CACHE_EXPIRE,redis.print);
					    if (err) {
					    	callback(-2,err);
					    	return;
					    }
					    callback(null);
					});
			    },
			    function setDB(callback){
					logger.debug("setDB",sql);
			        db.query(sql, function (err, result) {
			        	logger.debug("setDB done");
					  	if (err) {
			    			callback(-2,err);
			    			return;
			    		}
			    		callback(null);
					});
			    }
			],
			// optional callback
			function(err, results){
			    // the results array will equal ['one','two'] even though
			    // the second function had a shorter timeout.
			    if (err==null) {
			    	err = 1;
			    }
			    cb(err,results);
			});
		});
	},
	setChangeBaseInfo:function(key,data,cb){
		//方案1:RPC到大厅统一修改, 用于同时可能有多个战斗触发
		//方案2:直接自己改自己的, 用于确保同时只有一个战斗在进行
		//这里采用方案2, 因为大部分游戏确实需要确保同时只有一个战斗
		//爲了簡化邏輯, 这里先读再写, 确保数据一致性
		//这样有损性能, 但是在想到更好的方法前至少减少了出错的可能性

		var sql_plus_a = [];
		for (var k in data) {
			sql_plus_a.push(k+"="+k+"+"+data[k]);
		};
		key.sql_plus = sql_plus_a.join(",");
		var sql = utils.supplant('UPDATE u_account SET {sql_plus} WHERE uid={uid}',key);
		logger.debug(sql);
		var id = key.uid;
		var self = this;
		var method = "baseInfo";


		this.getBaseInfo(key,function(){
			logger.info(self.data);
			var sourceData = self.data[self.cacheCategory][method][id];
			var targetData = {};
			
			for (var k in data) {
				//cache取出的都是字符串,切记!!!!
				targetData[k] =  sourceData[k]*1 + data[k];
			};
			logger.debug(targetData);
			var real_key = self.getCacheKey(method,id);
			async.parallel([
			    function setCache(callback){
			    	logger.debug("setCache",real_key,targetData);
			    	kvdb.hmset(real_key, targetData,function(err, res) {
			    		logger.debug("setCache done",err);
						kvdb.expire(real_key,self.CACHE_EXPIRE,redis.print);
					    if (err) {
					    	callback(-2,err);
					    	return;
					    }
					    callback(null);
					});
			    },
			    function setDB(callback){
					logger.debug("setDB",sql);
			        db.query(sql, function (err, result) {
			        	logger.debug("setDB done");
					  	if (err) {
			    			callback(-2,err);
			    			return;
			    		}
			    		callback(null);
					});
			    }
			],
			// optional callback
			function(err, results){
			    // the results array will equal ['one','two'] even though
			    // the second function had a shorter timeout.
			    if (err==null) {
			    	err = 1;
			    }
			    cb(err,results);
			});
		});
	},
});
module.exports = UserDM;