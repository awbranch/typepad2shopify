const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const async = require('async');
const url = require('url');
const path = require('path');
const {isUrl, getUrl, getUrlFilePart} = require('./utils');

function moveImages(source, dest, newRoot) {
	console.log('Move Images: ' + source + ' -> ' + dest + ' -> ' + newRoot);
	
	const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));

	newRoot = newRoot.trim();
	
	if(!isUrl(newRoot)) {
		console.log(`Destination URL is invalid: ${newRoot}`);
		process.exit(1);
	}
	
	if(newRoot.charAt(newRoot.length-1) !== '/') {
		newRoot += '/';
	}
	
	articles.forEach(article => {
		let $ = cheerio.load(article.body);
		
		$('img').each(function () {
			
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
			
			let newSrc = newRoot + filePart;
			
			img.attr("src", newSrc);
			
			console.log("Moving")
			console.log(src);
			console.log("-- to --")
			console.log(newSrc);
			console.log("============");
			
		});
		
		article.body = $.html();
		
	});
	
	// Write articles to dest
	fs.writeFileSync(dest, JSON.stringify(articles, null, '\t'));

	console.log(`Success: wrote: ${dest}`);
}

module.exports = moveImages;
