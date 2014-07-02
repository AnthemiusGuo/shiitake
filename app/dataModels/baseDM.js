var BaseDM = Class.extend({
	init : function() {
		this.CACHE_EXPIRE = 3600;
	}
	getCache : function(category,method,key,cb_bingo,cb_noCache){
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
		    cb_bingo(1,reply);
		});
	},
	setCache : function(category,method,key,value,cb){
		var real_key = category+"/"+method+"/"+key;
		kvdb.set(real_key, value,function(err, res) {
			kvdb.expire(real_key,this.CACHE_EXPIRE);
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
};
module.exports = BaseDM;