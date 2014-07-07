exports.isAbsolute = function(path){
  if ('/' == path[0]) return true;
  if (':' == path[1] && '\\' == path[2]) return true;
  if ('\\\\' == path.substring(0, 2)) return true; // Microsoft Azure absolute path
};

exports.checkParam = function(data,keys){
  for (var k in keys) {
  	if (!F.isset(data[keys[k]])) {
  		return false;
  	}
  }
  return true;
};

exports.supplant = function (s,o) {
    return s.replace(
        /\{([^{}]*)\}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

exports.trim = function (s) {
    return s.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
};

