var BaseDM = require('framework/base/baseDM');
var RobotDM = BaseDM.extend({
	init : function() {
		this._super();
		this.cacheCategory = "robot";
		this.cacheTyp = {
			baseInfo : "hash"
		};
		
		this.CACHE_EXPIRE = 86400;
	},
	getRobotList:function(param,callback){
		//参数只有forTyp，

		// var sql = utils.supplant('SELECT * FROM u_account WHERE uid={uid}',param);
		var forTyp = param.forTyp;
		var self = this;

		var collection = mongodb.collection('s_robot');
		var self = this;
    	collection.findOne({forTyp:forTyp}, function(err, info) {
    		if (err!=null){
    			callback(-2,err);
		    	return;
    		}
    		if (info===null){
    			callback(-1);
		    	return;
    		}
    		callback(2,info.uids);

    	});
	},
	
});
module.exports = RobotDM;