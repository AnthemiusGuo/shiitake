var BaseDM = require('app/dataModels/baseDM');
var UserDM = BaseDM.extend({
	init : function() {
		this._super();
		this.baseInfo = {
			
		}
	},
	getBaseInfo:function(param,cb){
		var sql = utils.supplant('SELECT * FROM u_account WHERE uid={uid}',param);
		this.doOneLineSelectWithCache("user","BaseInfo",param.uid,sql,cb);
	}
});
module.exports = UserDM;