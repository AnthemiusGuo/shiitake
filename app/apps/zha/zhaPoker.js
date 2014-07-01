var ZhaPoker = function(){
	this.id = 0;
	this.reset();
} 
ZhaPoker.prototype.reset = function(){
	this.result = 0;
	this.pokers = [];
	this.poker_typ = {};
}
module.exports = ZhaPoker;