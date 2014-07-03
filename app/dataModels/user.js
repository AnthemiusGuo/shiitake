var BaseDM = require('app/dataModels/baseDM');
var UserDM = BaseDM.extend({
	init : function() {
		this._super()
	},
	getBaseInfo:function(param,cb){
		var self = this;
		this.getCache("user","BaseInfo",param.uid,cb,function(ret,data){
			var sql = utils.supplant('SELECT * FROM u_account WHERE uid={uid}',param);
			db.query(sql, function(err, rows, fields) {
	    		if (err) {
	    			cb(-2,err);
	    			return;
	    		}
	    		if (rows.length==0) {
	    			cb(-1);
	    			return;
	    		}

	    		var userInfo = rows[0];
	    		// console.log("db get user",userInfo);
	    		self.setCache("user","BaseInfo",param.uid,userInfo);
	    		cb(1,userInfo);

	    	});
		});
	}
});
module.exports = UserDM;