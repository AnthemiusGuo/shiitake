var baseServer = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
		this.errorInfo = "";
	},
	getErr : function(){
		return this.errorInfo;
	},
	setErr : function(msg){
		this.errorInfo = msg;
		console.log(this.id+"@"+this.typ+" : "+msg);
	},
	run : function() {
		
	}
});

module.exports = baseServer;