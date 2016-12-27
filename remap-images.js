const fs = require('fs');
const fsex = require('fs-extra');
const http = require('http');
const cheerio = require('cheerio');
const async = require('async');
const url = require('url');
const path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type');

const {isUrl, getUrl, getUrlFilePart} = require('./utils');

const argv = require('yargs')
		.usage("This performs operations on all the img tags in the source json and writes the results to the dest file\n\n" +
				"Usage:     $0 <source> <dest> [options]\n\n" +
						
				"Example 1: $0 blog.json blog-new.json --root http://www.myhost.com/assets/images/\n" +
				"           Sets the url of all images in blog.json to http://www.myhost.com/assets/images/\n\n" +
						
				"Example 2: $0 blog.json blog-new.json --extensions MyBlogImages/\n" +
				"           Detects and adds the file type of the images in MyBlogImages and updates the URL in blog-new.json")
		
		.option('root', {
			describe: 'Update all the image tags src urls to point to this URL',
			type: 'string'
		})
		.option('extensions', {
			describe: 'Add file extensions to all the images in this directory. Must also specify imageDir',
			type: 'boolean'
		})
		.option('validate', {
			describe: 'If an image is not valid it will replace the image the missing.jpg file.',
			type: 'boolean'
		})
		.option('imageDir', {
			describe: 'Location of images to add extensions to or validate.',
			type: 'string'
		})
		.demand(2)
		.wrap(null)
		.strict()
		.argv;

let source = argv._[0];
let dest = argv._[1];
let newRoot = argv.root;

let extensions = argv.extensions;
let validate = argv.validate;
let imageDir = argv.imageDir;

if(!newRoot && !extDir) {
	console.log("Nothing to do. Specify --root or --extensions");
	process.exit(1);
}

if((extensions || validate) && (!imageDir || imageDir === '' || !fs.existsSync(imageDir))) {
	console.log("imageDir must refernce a folder if 'extensions' or 'validate' switches are specified");
	process.exit(1);
}

console.log('Remap Images: ' + source + ' -> ' + dest);

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
		fixImage(img, newRoot, extensions, validate, imageDir);
	});
	
	article.body = $.html();
	
});


// Write articles to dest
fs.writeFileSync(dest, JSON.stringify(articles, null, '\t'));
console.log(`Success: wrote: ${dest}`);
	
function fixImage(img, newRoot, extensions, validate, imageDir) {
	
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
		
		console.log("Moving");
		console.log(src);
		console.log("-- to --");
		console.log(newSrc);
		console.log("============");
	}
	
	if(validate || extensions) {
		
		let imgPath = path.join(imageDir, filePart);
		
		if(!fs.existsSync(imgPath)) {
			console.log(`WARNING >>>>>> File: ${imgPath} not found`);
			
			if(validate) {
				console.log(`Replacing with missing.jpg`);
				fsex.copySync('missing.jpg', imgPath);
			} else {
				return;
			}
		}
		
		let ext;
		let buffer = readChunk.sync(imgPath, 0, 262);
		let imgType = fileType(buffer);
		if(!imgType) {
			console.log(`WARNING >>>>>> File type not recognized: ${imgPath}`);
			
			if(validate) {
				ext = 'jpg';
				console.log(`Replacing with missing.jpg`);
				fsex.copySync('missing.jpg', imgPath);
			} else {
				return;
			}
		} else {
			ext = imgType.ext;
		}
		
		if(extensions) {
			let newImgPath = path.join(imageDir, filePart + `.${ext}`);
			fs.renameSync(imgPath, newImgPath);
			
			// Update the src in the img tag
			img.attr("src", `${img.attr("src")}.${ext}`)
		}
	}
}

