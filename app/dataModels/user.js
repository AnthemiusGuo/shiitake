var BaseDM = require('framework/base/baseDM');
var UserDM = BaseDM.extend({
	init : function() {
		this._super();
		this.cacheCategory = "user";
		this.cacheTyp = {
			baseInfo : "hash"
		};
		
		this.CACHE_EXPIRE = 86400;
	},
	getUserInfoFromDB:function(uid,callback){
		var collection = mongodb.collection('user');
		var self = this;
    	collection.findOne({uid:uid}, function(err, info) {
    		if (err!=null){
    			callback(-2,err);
		    	return;
    		}
    		if (info===null){
    			callback(-1);
		    	return;
    		}
    		//写缓存
    		self.setData("baseInfo",uid,info.baseInfo);
    		self.setCacheHash("baseInfo",uid,info.baseInfo);
    		if (!F.isset(info.extendInfo)){
    			info.extendInfo = {};
    		}
    		self.setData("extendInfo",uid,info.extendInfo);
    		self.setCacheHash("extendInfo",uid,info.extendInfo);

    		//其他内容不缓存redis
    		callback(2,info);

    	});
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
            	self.getUserInfoFromDB(id,function(ret,data){
            		if (ret<0){
            			callback(ret,data);
            		} else {
            			callback(ret,data[cacheMethod])
            		}
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
	},
	setBaseInfo:function(key,data,cb){
		/*
		$inc - increment a particular value by a certain amount
		$set - set a particular value
		$unset - delete a particular field (v1.3+)
		$push - append a value to an array
		$pushAll - append several values to an array
		$addToSet - adds value to the array only if its not in the array already
		$pop - removes the last element in an array
		$pull - remove a value(s) from an existing array
		$pullAll - remove several value(s) from an existing array
		$rename - renames the field
		$bit - bitwise operations
		*/
		// db.user.update({uid:10014},{$set:{"baseInfo.credits":1000,"baseInfo.exp":2000}})

		//同下, 方案2
		var targetData = {};
		for (var k in data) {
			targetData["baseInfo."+k] = data[k];
		};

		var id = key.uid;
		var self = this;
		var method = "baseInfo";

		//对于直接写，而不是写delta，没必要再读一次了，直接写就是了

		var real_key = self.getCacheKey(method,id);
		async.parallel([
		    function setCache(callback){
		    	logger.debug("setCache",real_key,data);
		    	//redis的好处在这里，我只要写回我要写回的项即可，其他值不用先读在写，这点优于memcache，不用担心冲掉别的进程的写入别的字段
		    	if (!F.isset(this.keySetExpireTS[real_key])){
					this.keySetExpireTS[real_key] = 0;
				} 
		    	kvdb.hmset(real_key, data,function(err, res) {
		    		logger.debug("setCache done",err);
		    		var now = utils.getNowTS()/1000;
					if (now - self.keySetExpireTS[real_key]>self.CACHE_EXPIRE-600) {
						//超时前10分钟没设置过超时了，设置一下
						//如果超时设定少于10分钟，那么每次都刷一次超时
						self.keySetExpireTS[real_key] = now;
						kvdb.expire(real_key,self.CACHE_EXPIRE,redis.print);
					}
				    if (err) {
				    	callback(-2,err);
				    	return;
				    }
				    callback(null);
				});
		    },
		    function setDB(callback){
		    	var collection = mongodb.collection('user');
		        collection.update({uid:id},{$set:targetData}, {w:1}, function(err, result) {
		        	if (err) {
		    			callback(-2,err);
		    			return;
		    		}
		    		callback(null);
		        });
		    }
		  //   function setDB(callback){
				// logger.debug("setDB",sql);
		  //       db.query(sql, function (err, result) {
		  //       	logger.debug("setDB done");
				//   	if (err) {
		  //   			callback(-2,err);
		  //   			return;
		  //   		}
		  //   		callback(null);
				// });
		  //   }
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
	},
	setChangeBaseInfo:function(key,data,cb){
		//方案1:RPC到大厅统一修改, 用于同时可能有多个战斗触发
		//方案2:直接自己改自己的, 用于确保同时只有一个战斗在进行
		//这里采用方案2, 因为大部分游戏确实需要确保同时只有一个战斗
		//爲了簡化邏輯, 这里直接写, 确保数据一致性
		//这样有损性能, 但是在想到更好的方法前至少减少了出错的可能性
		//对于游戏服务器，不持久化数据，每次开局全部重取所有用户数据
		//对于lobby，自己去再次getdata
		logger.info("user.setChangeBaseInfo",key,data);
		var targetData = {};
		var targetKV = [];
		for (var k in data) {
			targetData["baseInfo."+k] = data[k];
			targetKV.push({k:k,v:data[k]});
		};

		var id = key.uid;
		var self = this;
		var method = "baseInfo";

		//对于直接写，而不是写delta，没必要再读一次了，直接写就是了

		var real_key = self.getCacheKey(method,id);
		logger.info("user.begin write",real_key,targetData);
		async.parallel([
		    function setCache(callback){
		    	logger.info("setCache",real_key,targetKV);
		    	//redis的好处在这里，我只要写回我要写回的项即可，其他值不用先读在写，这点优于memcache，不用担心冲掉别的进程的写入别的字段
		    	if (!F.isset(self.keySetExpireTS[real_key])){
					self.keySetExpireTS[real_key] = 0;
				} 
				async.each(targetKV, function(item,cbb){
					logger.info("kv do hincrby",item);
					kvdb.hincrby(real_key,item.k,item.v,function(err){
						logger.info("kv do hincrby result",err);
						cbb(null);
					})
				}, function(err){
					logger.info("kv all each do hincrby result",err);
				    if (err) {
				    	callback(-2,err);
				    	return;
				    }
				    callback(null);
				});
				var now = utils.getNowTS()/1000;
				if (now - self.keySetExpireTS[real_key]>self.CACHE_EXPIRE-600) {
					//超时前10分钟没设置过超时了，设置一下
					//如果超时设定少于10分钟，那么每次都刷一次超时
					self.keySetExpireTS[real_key] = now;
					kvdb.expire(real_key,self.CACHE_EXPIRE,redis.print);
				}		    	
		    },
		    function setDB(callback){
		    	logger.info("mongodb do ",id,targetData);
		    	var collection = mongodb.collection('user');
		        collection.update({uid:id},{$inc:targetData}, {w:1}, function(err, result) {
		        	logger.info("mongodb ret ",err,result);
		        	if (err) {
		    			callback(-2,err);
		    			return;
		    		}
		    		callback(null);
		        });
		    }
		  //   function setDB(callback){
				// logger.debug("setDB",sql);
		  //       db.query(sql, function (err, result) {
		  //       	logger.debug("setDB done");
				//   	if (err) {
		  //   			callback(-2,err);
		  //   			return;
		  //   		}
		  //   		callback(null);
				// });
		  //   }
		],
		// optional callback
		function(err, results){
		    // the results array will equal ['one','two'] even though
		    // the second function had a shorter timeout.
		    logger.info("writeback ret ",err,results);
		    if (err==null) {
		    	err = 1;
		    }
		    cb(err,results);
		});
	},
});
module.exports = UserDM;