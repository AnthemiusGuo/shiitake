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
		var sql = utils.supplant('SELECT * FROM u_account WHERE uid={uid}',param);
		this.doOneLineSelectWithCache("baseInfo",param.uid,sql,cb);
	}
});
module.exports = UserDM;