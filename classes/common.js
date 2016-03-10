var fs = require('fs');
var path = require('path');

var common = {
	array: {}
};

common.array.compare = function (array1, array2) {
	return (array1.length == array2.length) && array1.every(function(element, index) {
		return element === array2[index];
	});
};

common.getDirectories = function (srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
};

common.deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				common.deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

module.exports = common;