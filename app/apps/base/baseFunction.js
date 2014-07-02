exports.isAbsolute = function(path){
  if ('/' == path[0]) return true;
  if (':' == path[1] && '\\' == path[2]) return true;
  if ('\\\\' == path.substring(0, 2)) return true; // Microsoft Azure absolute path
};

exports.checkParam = function(data,keys){
  for (var k in keys) {
  	if (!F.isset(data[k])) {
  		return false;
  	}
  }
  return true;
};