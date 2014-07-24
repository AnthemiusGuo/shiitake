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
	},
	setChangeBaseInfo:function(key,data,cb){
		//方案1:RPC到大厅统一修改, 用于同时可能有多个战斗触发
		//方案2:直接自己改自己的, 用于确保同时只有一个战斗在进行
		//这里采用方案2, 因为大部分游戏确实需要确保同时只有一个战斗
		
		var sql_plus_a = [];
		for (var k in data) {
			sql_plus_a.push(k+"="+k+"+"+data[k]);
		};
		key.sql_plus = sql_plus_a.join(",");
		var sql = utils.supplant('UPDATE u_account SET {sql_plus} WHERE uid={uid}',key);
		logger.debug(sql);

		this.doOneLineChangeUpdateWithCache("baseInfo",key.uid,data,sql,cb);
	},
});
module.exports = UserDM;