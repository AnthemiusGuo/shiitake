var BaseServer = require('framework/base/baseApp');
var EDriver = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.eQueueSys = {};
		this.eQueueUser = {};
		this.eventRunTyp = {"sys":{},"user":{}};
		//1:{name:"xxx",typ:"rpc",rpcTyp:"upstream"},
		//2:{name:"xxxxx",typ:"local"},

	},
	//清除所有事件, 开新服用
	truncate : function(typ){

		if (F.in_array("sys",typ)) {
			this.eQueueSys = {};
			return;
		}
		if (typ=="user") {
			this.eQueueUser = {};
			return;
		}
	},
	initFromDB : function(){
		//一启动时候从数据库同步数据过来;
		//之后数据库只写不读, 用于备份

	},
	runSysEvent : function(eventId){
		if (!F.isset(this.eQueueSys[eventId])){
			logger.error(eventId,"event id not exsits")!
			return;
		}
		var eventInfo = this.eQueueSys[eventId];
		if (!F.isset(this.eventRunTyp[eventInfo.typ])){
			logger.error(eventInfo.typ,"event typ not exsits")!
			return;
		}
		if (this.eventRunTyp[eventInfo.typ].typ=="local") {
			this["sysRun"+this.eventRunTyp[eventInfo.typ].name](eventInfo);
		}
		
	},
	doneEvent : function(typ,eventId){
		if (typ=="sys"){
			if (!F.isset(this.eQueueSys[eventId])){
				logger.error(eventId,"event id not exsits")!
				return;
			}
			this.eQueueSys[eventId] = null;
			//写回数据库
			
		} else if (typ=="user"){

		}
	}
});
module.exports = EDriver;