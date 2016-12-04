const url = require('url');

function isUrl(str) {
	try {
		url.parse(str);
		return true;
	}
	catch (err) {
		return false;
	}
}

function getUrl(str) {
	try {
		return url.parse(str);
	}
	catch (err) {
		return null;
	}
}

function getUrlFilePart(fullUrl) {
	
	let srcPath = fullUrl.pathname.split('/');
	if(srcPath.length <= 0) {
		return null;
	}
	
	return srcPath[srcPath.length-1];
}

module.exports = {isUrl, getUrl, getUrlFilePart}