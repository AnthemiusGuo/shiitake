var redis = require("redis");
var BaseDM = Class.extend({
	init : function() {
		this.CACHE_EXPIRE = 3600;
		this.useCache = false;
	},
	getCacheKey : function(category,method,key) {
		return category+"/"+method+"/"+key;
	},
	delCache : function(category,method,key){
		var real_key = this.getCacheKey(category,method,key);
		kvdb.del(real_key,redis.print);
	},
	getCacheHash : function(category,method,key,cb_bingo,cb_noCache){
		if (!this.useCache) {
			cb_noCache(-1);
			return;
		}
		var real_key = this.getCacheKey(category,method,key);
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
		    console.log(category,method,key,"hit cache!!!");
		    console.log(reply);
		    cb_bingo(1,reply);
		});
	},
	setCacheHash : function(category,method,key,value,cb){
		if (!this.useCache) {
			if (!F.isset(cb)){
				return;
			}
			cb(1);
			return;
		}
		var real_key = this.getCacheKey(category,method,key);
		var self = this;
		kvdb.set(real_key, value,function(err, res) {
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
	doOneLineSelectWithCache: function(cacheCategory,cacheMethod,id,sql,cb){
		var self = this;
		this.getCacheHash(cacheCategory,cacheMethod,id,cb,function(ret,data){
			db.query(sql, function(err, rows, fields) {
	    		if (err) {
	    			cb(-2,err);
	    			return;
	    		}
	    		if (rows.length==0) {
	    			cb(-1);
	    			return;
	    		}
	    		var info = rows[0];
	    		// console.log("db get user",userInfo);
	    		self.setCacheHash(cacheCategory,cacheMethod,id,info);
	    		cb(1,info);
	    	});
		});
	}
});
module.exports = BaseDM;