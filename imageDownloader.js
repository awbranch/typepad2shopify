const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const async = require('async');
const url = require('url');
const path = require('path');
const {getUrl, getUrlFilePart} = require('./utils');
	
function downloadImages(source, dest) {
	console.log('Download Images: ' + source + ' -> ' + dest);
	
	const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));
	
	console.log(`Loaded ${articles.length} articles`);
	
	// Make sure the dest dir exists
	if(!fs.existsSync(dest)) {
		fs.mkdirSync(dest);
	}
	
	// Collect all the images into downloadArr
	let downloadArr = [];
	articles.forEach(article => {
		let $ = cheerio.load(article.body);
		$('img').each(function() {
			
			let img = $(this);
			let src = img.attr('src');
			
			let srcUrl = getUrl(src);
			if(!srcUrl) {
				console.log(`Image src URL is invalid: ${src}`);
				process.exit(1);
			}
			
			let filePart = getUrlFilePart(srcUrl);
			if(!filePart) {
				console.log(`Image src URL has invalid file part: ${src}`);
				process.exit(1);
			}
			
			let filePath = path.join(dest, filePart);
			
			downloadArr.push({img, src, srcUrl, filePath});
			
		});
	});
	
	async.eachSeries(downloadArr, (item, cb) => {
		console.log(`Downloading Image: ${item.src}`);
		download(item.srcUrl, item.filePath, cb);
	}, function done() {
		console.log('Download Complete');
	});
}


function download(url, dest, cb) {
	let file = fs.createWriteStream(dest);
	http.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close(cb);  // close() is async, call cb after close completes.
		});
	}).on('error', function(err) { // Handle errors
		fs.unlink(dest); // Delete the file async. (But we don't check the result)
		if (cb) cb(err.message);
	});
}

module.exports = downloadImages;
