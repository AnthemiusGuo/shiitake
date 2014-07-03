var redis = require("redis");
var BaseDM = Class.extend({
	init : function() {
		this.CACHE_EXPIRE = 3600;
		this.useCache = true;
	},
	delCache : function(category,method,key){
		kvdb.
	}
	getCache : function(category,method,key,cb_bingo,cb_noCache){
		if (!this.useCache) {
			cb_noCache(-1);
			return;
		}
		var real_key = category+"/"+method+"/"+key;
		kvdb.get(real_key, function(err, reply) {
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
	setCache : function(category,method,key,value,cb){
		if (!this.useCache) {
			if (!F.isset(cb)){
				return;
			}
			cb(1);
			return;
		}
		var real_key = category+"/"+method+"/"+key;
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
	}
});
module.exports = BaseDM;