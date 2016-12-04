const fs = require('fs');

function toJson(source, dest) {
	
	let text = fs.readFileSync(source, 'ascii');
	let lines = text.split('\n');
	
	let articles = [];
	let article;
	
	let i = 0;
	
	while(i < lines.length) {
		
		article = {};
		
		article.author = readPair(lines, i++, "AUTHOR");
		article.authorEmail = readPair(lines, i++, "AUTHOR EMAIL");
		article.title = readPair(lines, i++, "TITLE");
		article.status = readPair(lines, i++, "STATUS");
		article.allowComments = readPair(lines, i++, "ALLOW COMMENTS");
		article.convertBreaks = readPair(lines, i++, "CONVERT BREAKS");
		article.allowPings = readPair(lines, i++, "ALLOW PINGS");
		article.basenane = readPair(lines, i++, "BASENAME");
		
		article.categories = [];
		let category;
		while((category = readPair(lines, i, "CATEGORY", false)) !== null) {
			article.categories.push(category);
			i++;
		}
		
		// Read the blank line after CATEGORY
		readTag(lines, i++, "");
		
		article.uniqueUrl = readPair(lines, i++, "UNIQUE URL");
		article.date = readPair(lines, i++, "DATE");
		
		readTag(lines, i++, "-----");
		readTag(lines, i++, "BODY:");
		let readInfo = readTextBlock(lines, i);
		article.body = readInfo.text;
		i+= readInfo.linesRead;
		
		readTag(lines, i++, "EXTENDED BODY:");
		readInfo = readTextBlock(lines, i);
		article.extendedBody = readInfo.text;
		i+= readInfo.linesRead;
		
		readTag(lines, i++, "EXCERPT:");
		readInfo = readTextBlock(lines, i);
		article.exerpt = readInfo.text;
		i+= readInfo.linesRead;
		
		readTag(lines, i++, "KEYWORDS:");
		readInfo = readTextBlock(lines, i);
		article.keyWords = readInfo.text;
		i+= readInfo.linesRead;
		
		article.comments = [];
		while(readTag(lines, i, "COMMENT:", false) !== null) {
			i++;
			let comment = {};
			article.comments.push(comment);
			
			comment.author = readPair(lines, i++, "AUTHOR");
			comment.email = readPair(lines, i++, "EMAIL");
			comment.ip = readPair(lines, i++, "IP");
			comment.url = readPair(lines, i++, "URL");
			comment.date = readPair(lines, i++, "DATE");
			readInfo = readTextBlock(lines, i);
			comment.message = readInfo.text;
			i+= readInfo.linesRead;
		}
		
		article.pings = [];
		while(readTag(lines, i, "PING:", false) !== null) {
			i++;
			let ping = {};
			article.pings.push(ping);
			ping.title = readPair(lines, i++, "TITLE");
			ping.url = readPair(lines, i++, "URL");
			ping.ip = readPair(lines, i++, "IP");
			ping.blogName = readPair(lines, i++, "BLOG NAME");
			ping.date = readPair(lines, i++, "DATE");
			readInfo = readTextBlock(lines, i);
			ping.message = readInfo.text;
			i+= readInfo.linesRead;
		}
		
		readTag(lines, i++, "--------");
		
		articles.push(article);
		
		// Are we at the end?
		if(endCheck(lines, i)) {
			break;
		}
	}
	
	// Write articles to dest
	fs.writeFileSync(dest, JSON.stringify(articles, null, '\t'));
	
	console.log(`Success: wrote: ${dest}`);
}

function readTag(lines, i, value, strict) {
	strict = strict === undefined ? true : strict;
	
	let line = lines[i];
	if(line !== value) {
		if(strict) {
			console.log(`Expected line: ${value} at line: ${i + 1}`);
			process.exit(1);
		} else {
			return null;
		}
	}
	return line;
}

function readPair(lines, i, name, strict) {
	strict = strict === undefined ? true : strict;
	
	let pairRegex = /(.*?):\s*(.*)/;
	let line = lines[i];
	let match = pairRegex.exec(line);
	if(match === null || match[1] !== name) {
		if(strict) {
			console.log(`Expected tag: ${name} at line: ${i + 1}`);
			process.exit(1);
		}
		else {
			return null;
		}
	}
	
	return match[2];
}

function readTextBlock(lines, index) {
	
	let textArr = [];
	
	for (let i=index; i < lines.length; i++) {
		
		let line = lines[i];
		if(line === "-----") {
			return {
				text: textArr.join("\n"),
				linesRead: textArr.length + 1
			}
		} else {
			textArr.push(line);
		}
	}
	
	console.log(`End of text array '-----' not found starting at line: ${index + 1}`);
	process.exit(1);
}

function endCheck(lines, i) {
	// If all the remaining lines are just blank, we are at the end
	for(; i<lines.length; i++) {
		let line = lines[i];
		if(line !== "") {
			return false;
		}
	}
	
	return true;
}

module.exports = toJson;
