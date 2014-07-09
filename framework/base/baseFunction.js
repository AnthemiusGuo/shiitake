var path = require('path');
var fs = require('fs');
var dirname = path.dirname;
var basename = path.basename;
var extname = path.extname;
var exists = fs.existsSync || path.existsSync;
var join = path.join;

var isAbsolute = function(path){
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

var lookup = function(root,path){
    if (!isAbsolute(path)) {
      path = join(root, path);
    }
    if (exists(path)) {
      return true;
    } 
    path = path+".js";
    
    if (exists(path)) {
      return true;
    } else {
      return false;
    }
};

exports.lookup = lookup;
exports.isAbsolute = isAbsolute;