var baseServer = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
	},
});

module.exports = baseServer;