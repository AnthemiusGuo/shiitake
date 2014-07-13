var PokerUtils = {};
var ConfigNames = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
var ConfigHua = ["黑桃","红桃","梅花","方块","王"];
PokerUtils.getPokerInfoBy54 = function(pokerIn54){
	//0-12 0:黑桃,13-25 1:红桃, 26-38 2:梅花 39-51 3:方块
	//52 4:小王 53 4:大王 
	if (pokerIn54==52){
		return {typ:4,dianshu:1,mian:"小王",hua:ConfigHua[4]};
	} else if (pokerIn54==53) {
		return {typ:4,dianshu:2,mian:"大王",hua:ConfigHua[4]};
	} else {
		var typ = Math.floor(pokerIn54 /13);
		var value = pokerIn54%13;
		return {typ:typ,dianshu:value,mian:ConfigNames[value],hua:ConfigHua[typ]};
	}
}

PokerUtils.getPoker54ByInfo = function(pokerInfo){
	//0-12 0:黑桃,13-25 1:红桃, 26-38 2:梅花 39-51 3:方块
	//52 4:1 小王 53 4:2 大王 
	if (pokerInfo.typ==4){
		return 52+pokerInfo.value -1;
	} else {
		return pokerInfo.typ*13+pokerInfo.value;
	}
}
module.exports = PokerUtils;