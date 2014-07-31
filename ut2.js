var x = {xxxx:1,yyyy:2};
x.xxxx = null;
console.log(x);
for (var k in x) {
	console.log(k,x[k],"***");
};