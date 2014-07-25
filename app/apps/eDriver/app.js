var BaseEDriver = require('framework/base/baseEDriver');
var EDriver = BaseEDriver.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		//指定所有事件的执行方式,和id
		this.eventRunTyp = {"sys":
								{
									1:{name:"xxx",typ:"rpc",rpcTyp:"upstream"},
									2:{name:"xxxxx",typ:"local"},
								},
							"user":{}};
	}
});
module.exports = EDriver;