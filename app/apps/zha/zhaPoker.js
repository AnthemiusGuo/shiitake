var PokerUtils = require('app/base/pokerUtils');

var ZhaPoker = function(id){
	this.id = id;
	this.reset();
} 
ZhaPoker.prototype.reset = function(){
	this.result = 0;
	this.pokers = [];
	this.poker_typ = {};
}
ZhaPoker.prototype.setPokers = function(pokers){
	this.pokers = pokers;
	this.analysePokerTyp();
	logger.info(this.poker_typ);
}
ZhaPoker.prototype.analysePokerTyp = function(){
	logger.info("analysePokerTyp");
	var huase = [];
	var dianshu = [];
	for (var k in this.pokers) {
		var tempInfo = 	PokerUtils.getPokerInfoBy54(this.pokers[k]);
		logger.debug(tempInfo);
		huase.push(tempInfo.typ);
		dianshu.push(tempInfo.dianshu);
	}
    dianshu = F.sort(dianshu);
   	//#豹子>同花顺>金花>顺子>对子>散牌
    if (dianshu[0]==dianshu[1] && dianshu[1]==dianshu[2]) {
        this.poker_typ = {typ:6,dianshu:dianshu};
        //豹子
        return;
    }
    if (huase[0]==huase[1] && huase[1]==huase[2]) {
    	//三个同花，检查同花顺

    	//特殊同花顺, 1,2,3=>12,0,1
		if(dianshu[2]==12&&dianshu[1]==2&&dianshu[2]==3){
			this.poker_typ = {typ:5,dianshu:[12,0,1]};
		}else{
			if (dianshu[0] == dianshu[1]-1 && dianshu[1]==dianshu[2]-1){
				this.poker_typ = {typ:5,dianshu:dianshu};
				//同花顺
			} else {
				this.poker_typ = {typ:4,dianshu:dianshu};
			}
		}
        return;
    }
    //特殊顺子
	if(dianshu[2]==12&&dianshu[1]==0&&dianshu[0]==1){
		this.poker_typ = {typ:3,dianshu:dianshu};
		return;
	}
    if (dianshu[0] == dianshu[1]-1 && dianshu[1]==dianshu[2]-1){
        this.poker_typ = {typ:3,dianshu:dianshu};
		return;

    } 
    if (dianshu[0]==dianshu[1] || dianshu[1]==dianshu[2]) {
        this.poker_typ = {typ:2,dianshu:dianshu};
        //#对子
        return;
    }
    this.poker_typ = {typ:1,dianshu:dianshu};
    return;
}

module.exports = ZhaPoker;