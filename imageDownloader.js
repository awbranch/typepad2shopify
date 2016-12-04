var fs = require('fs');

function downloadImages(source, dir) {
	console.log("Download Images: " + source + " -> " + dir);
	
	const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));
	
	console.log(`Loaded ${articles.length} articles`);
	
	articles.forEach(article => {
		
		console.log(article.body);
		
	});
	
}

module.exports = downloadImages;
