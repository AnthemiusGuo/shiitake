var BaseServer = require('framework/base/baseApp');
var AppBaseServer = BaseServer.extend({
	batchReload: function(uids) {
		for (var i = 0; i < uids.length; i++) {
			var uid = uids[i];
			if (!F.isset(this.userSocketManager.idClientMapping[uid])){
				continue;
			}
			var userSession = this.userSocketManager.idClientMapping[uid];

			dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
				if (ret>0) {
                	logger.debug("batchReload refreshed",uid);
	            	userSession.userInfo = data;
					userSession.onGetUserInfo();
                    //无需再callback了
                    // callback(null, 'done');
                } else {
                	//出错处理, 例如用户已经删除等
                }
            });
		};
	}
});
module.exports = AppBaseServer;