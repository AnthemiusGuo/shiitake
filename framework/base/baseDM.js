var redis = require("redis");
var BaseDM = Class.extend({
	init : function() {
		this.CACHE_EXPIRE = 3600;
		this.useCache = true;
		this.data = {};
		this.cacheCategory = "base";

	},

	getCacheKey : function(method,key) {
		return this.cacheCategory+"/"+method+"/"+key;
	},
	delCache : function(method,key){
		var real_key = this.getCacheKey(method,key);
		kvdb.del(real_key,redis.print);
	},
	changeHashFieldCache : function(method,key,field,value){
		var real_key = this.getCacheKey(method,key);
		kvdb.hincrby(real_key,field,1*value,redis.print);	
	},
	setData : function(method,key,value) {
		if (!F.isset(this.data[this.cacheCategory])) {
			this.data[this.cacheCategory] = {};
		}
		if (!F.isset(this.data[this.cacheCategory][method])) {
			this.data[this.cacheCategory][method] = {};
		}
		this.data[this.cacheCategory][method][key] = value;
	},
	getCacheHash : function(method,key,cb_bingo,cb_noCache){
		if (!this.useCache) {
			cb_noCache(-1);
			return;
		}
		var self = this;
		var real_key = this.getCacheKey(method,key);
		kvdb.hgetall(real_key, function(err, reply) {
		    if (err) {
		    	cb_noCache(-2,err);
		    	return;
		    }
		    if (reply===null) {
		    	cb_noCache(-1);
		    	return;
		    }
		    //hit cache!!!
		    self.setData(method,key,reply);
		    logger.trace(method,key,"hit cache!!!");
		    cb_bingo(1,reply);
		});
	},
	setCacheHash : function(method,key,value,cb){
		this.setData(method,key,value);
		if (!this.useCache) {
			if (!F.isset(cb)){
				return;
			}
			cb(1);
			return;
		}
		var real_key = this.getCacheKey(method,key);
		var self = this;
		kvdb.hmset(real_key, value,function(err, res) {
			kvdb.expire(real_key,self.CACHE_EXPIRE,redis.print);
			if (!F.isset(cb)){
				return;
			}
		    if (err) {
		    	cb(-2,err);
		    	return;
		    }
		    cb(1);
		});
	},
	doOneLineChangeUpdateWithCache: function(method,id,data,sql,cb){

		var self = this;
		async.waterfall([
            function changeCache(callback) {
                if (!F.isset(this.data[this.cacheCategory]) || !F.isset(this.data[this.cacheCategory][method]) || !F.isset(this.data[this.cacheCategory][method][id])) {
					//直接数据库, 删除cache以便下次自动更新
					this.delCache(method,id);
					callback(null);
				} else {
					var real_key = this.getCacheKey(method,key);
					kvdb.hincrby(real_key,field,1*value,redis.print);	
				}
            },
            function getDB(callback){
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

		    		// logger.debug("db get user",userInfo);
		    		self.setCacheHash(cacheMethod,id,info);
		    		callback(1,info);
		    	});
            }
        ], function doneAll (err, result) {
            if (err && err<=0) {
                logger.error("doneAll with err",err,result);
                cb(err,result);
            } else {
            	cb(1,result);
            }
            
        });	
		
		for (var k in data) {
			this.changeHashFieldCache(method,id,k,data[k]);			
		}
		db.query(sql, function (err, result) {
		  	if (err) {
    			cb(-2,err);
    			return;
    		}
		})
	},
	doOneLineSelectWithCache: function(cacheMethod,id,sql,cb){
		var self = this;
		async.waterfall([
            function getCacheHash(callback) {
                if (!this.useCache) {
					callback(null);
					return;
				}
				var real_key = this.getCacheKey(method,key);
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
				    self.setData(method,key,reply);
				    logger.trace(method,key,"hit cache!!!");
				    callback(1,reply);
				});
            },
            function getDB(callback){
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

		    		// logger.debug("db get user",userInfo);
		    		self.setCacheHash(cacheMethod,id,info);
		    		callback(1,info);
		    	});
            }
        ], function doneAll (err, result) {
            if (err && err<=0) {
                logger.error("doneAll with err",err,result);
                cb(err,result);
            } else {
            	cb(1,result);
            }
            
        });	
	}
});
module.exports = BaseDM;