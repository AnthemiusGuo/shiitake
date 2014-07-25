var DataModelManager = Class.extend({
	init : function() {
		this.dms = {};
	},
	setData : function(category,method,key,data,cb){
		if (!F.isset(this.dms[category])) {
			var DM = require('app/dataModels/'+category);
			this.dms[category] = new DM();
		}
		this.dms[category]["set"+method](key,data,cb);
	},
	setDataChange : function(category,method,key,data,cb){
		if (!F.isset(this.dms[category])) {
			var DM = require('app/dataModels/'+category);
			this.dms[category] = new DM();
		}
		this.dms[category]["setChange"+method](key,data,cb);
	},
	getData: function(category,method,param,cb){
		if (!F.isset(this.dms[category])) {
			var DM = require('app/dataModels/'+category);
			this.dms[category] = new DM();
		}
		this.dms[category]["get"+method](param,cb);
	},
	delKVDBGlobal : function(k){
		var real_key = "global/"+k;
		kvdb.del(real_key,redis.print);
	},
	getHashKVDBGlobal: function(k,cb){
		var real_key = "global/"+k;
		kvdb.hgetall(real_key, function(err, reply) {
		    if (err) {
		    	cb(-2,err);
		    	return;
		    }
		    if (reply===null) {
		    	cb(-1);
		    	return;
		    }
		    //hit cache!!!
		    logger.trace("global",k,"hit cache!!!");
		    cb(1,reply);
		});
	},
	setHashKVDBGlobal: function(k,v,cb){
		var real_key = "global/"+k;
		kvdb.hmset(real_key, v,function(err, res) {
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
	getHashKeyValueKVDBGlobal: function(totalk,k,cb){
		var real_key = "global/"+totalk;
		kvdb.hget(real_key,k, function(err, reply) {
		    if (err) {
		    	cb(-2,err);
		    	return;
		    }
		    if (reply===null) {
		    	cb(-1);
		    	return;
		    }
		    //hit cache!!!
		    logger.trace("global",k,"hit cache!!!");
		    cb(1,reply);
		});
	},
	setHashKeyValueKVDBGlobal: function(totalk,k,v,cb){
		var real_key = "global/"+totalk;
		kvdb.hset(real_key, k,v,function(err, res) {
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

});
module.exports = DataModelManager;