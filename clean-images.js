const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const async = require('async');
const url = require('url');
const path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type');

const {isUrl, getUrl, getUrlFilePart} = require('./utils');

const argv = require('yargs')
		.usage("This performs operations on all the img tags in the source-json and writes the results to the dest-json file\n\n" +
				"Usage:     $0 <source-json> <dest-json> [options]\n\n" +
						
				"Example 1: $0 blog.json blog-new.json -root http://www.myhost.com/assets/images/\n" +
				"           Sets the url of all images in blog.json to http://www.myhost.com/assets/images/\n\n" +
						
				"Example 2: $0 blog.json blog-new.json -extensions MyBlogImages/\n" +
				"           Detects and adds the file type of the images in MyBlogImages and updates the URL in blog-new.json")
		
		.option('root', {
			describe: 'Update all the image tags src urls to point to this URL',
			type: 'string'
		})
		.option('extensions', {
			describe: 'Add file extensions to all the images in this directory.',
			type: 'string'
		})
		.demand(2)
		.wrap(null)
		.strict()
		.argv;


let source = argv._[0];
let dest = argv._[1];
let newRoot = argv.root;
let addExt = argv.extensions;

if(!newRoot && !addExt) {
	console.log("Nothing to do. Specify --root or --extensions");
	process.exit(1);
}

moveImages(source, dest, newRoot, addExt);

function moveImages(source, dest, newRoot, extDir) {
	console.log('Move Images: ' + source + ' -> ' + dest);
	
	const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));
	
	if(newRoot) {
		newRoot = newRoot.trim();
		
		if(!isUrl(newRoot)) {
			console.log(`Destination URL is invalid: ${newRoot}`);
			process.exit(1);
		}
		
		if(newRoot.charAt(newRoot.length-1) !== '/') {
			newRoot += '/';
		}
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
			
			if(newRoot) {
				let newSrc = newRoot + filePart;
				
				img.attr("src", newSrc);
				
				console.log("Moving")
				console.log(src);
				console.log("-- to --")
				console.log(newSrc);
				console.log("============");
			}
			
			if(extDir) {
				
				// See if the file has an extension
				let curExt = path.extname(filePart);
				if(curExt === '') {
					
					let imgPath = path.join(extDir, filePart);
					if(!fs.existsSync(imgPath)) {
						console.log(`WARNING >>>>>> File: ${imgPath} not found`);
					}
					else {
						
						let buffer = readChunk.sync(imgPath, 0, 262);
						let imgType = fileType(buffer);
						if(!imgType) {
							console.log(`WARNING >>>>>> File type not recognized: ${imgPath}`);
						}
						else {
							
							// Update the file
							let newImgPath = path.join(extDir, filePart + `.${imgType.ext}`);
							fs.renameSync(imgPath, newImgPath);
							
							// Update the src in the img tag
							img.attr("src", `${img.attr("src")}.${imgType.ext}`)
						}
					}
				}
			}
		});
		
		article.body = $.html();
		
	});
	
	// Write articles to dest
	fs.writeFileSync(dest, JSON.stringify(articles, null, '\t'));

	console.log(`Success: wrote: ${dest}`);
}

module.exports = moveImages;
