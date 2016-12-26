const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');

const argv = require('yargs')
		.usage('This writes the cleaned blog.json file to Shopify.\n\n' +
				'Usage:   $0 <source-json> <store name> <api key> <password> <blog id>\n\n' +
		    'Example: $0 blog.json mystore xxx yyy zzz/\n' +
		    '         Writes blog.json to Shopfiy where mystore is your Shopify store name, your api key is xxx and ' +
				'         password is yyy and zzz is your blog id.' +
		    '         You\'ll need to get the API key, password and blog id from Shopify. See the README.md for details')
		.demand(5)
		.wrap(null)
		.strict()
		.argv;

let source = argv._[0];
let storeName = argv._[1];
let apiKey = argv._[2];
let password = argv._[3];
let blogId = argv._[4];

storeBlog(source, storeName, apiKey, password, blogId);

function storeBlog(source, storeName, apiKey, password, blogId) {
	console.log('Store Blog to Shopify: ' + source);
	
	const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));
	
	console.log(`Loaded ${articles.length} articles`);
	
	let newArticles = [];
	
	articles.forEach(sa => {
		
		let $ = cheerio.load(sa.body);
		let da = {};
		
		da.title = sa.title;
		da.author = sa.author;
		da.tags = sa.categories.join(",");
		da.body_html = sa.body;
		da.published = true;
		da.published_at = new Date(sa.date).toISOString();

		// Get the first image in the body
		let images = $('img').first();
		if(images.length > 0) {
			let src = images.attr('src');
			if(src) {
				da.image = { src: src }
			}
		}
		
		newArticles.push({article: da});
	});
	
	// https://0db6979dbf7b66357c77d768271c521f:9dc57442841cca25c9cf8a4a4291b361@branchhomestead.myshopify.com/admin/orders.json
	
	let postUrl = `https://${apiKey}:${password}@${storeName}.myshopify.com/admin/blogs/${blogId}/articles.json`;
	
	async.eachSeries(newArticles, (art, cb) => {
		console.log(`Writing Article: ${art.article.title}`);
		
		console.log("--------------------");
		console.log(postUrl);
		console.log(JSON.stringify(art));
		console.log("--------------------");
		
		request({
			method: "POST",
			uri: postUrl,
			body: art,
			json: true
		},
		function(err, httpResponse, body) {
			if(err) {
				return cb(err);
			}
			if(httpResponse.statusCode < 200 || httpResponse.statusCode > 299) {
				return cb("Error: " + httpResponse.statusMessage + " " + JSON.stringify(body));
			}
			console.log("Success");
			cb(null);
		});
		
	}, function done(err) {
		if(err) {
			console.log(err);
		} else {
			console.log('Download Complete');
		}
	});
}
