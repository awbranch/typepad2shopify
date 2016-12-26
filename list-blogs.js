const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');

const argv = require('yargs')
		.usage('A utility to list all your blogs, to help you find your blog is in Shopify.\n\n' +
				'Usage:   $0 <store name> <api key> <password>\n\n' +
		    'Example: $0 mystore my-api-key my-api-password/\n')
		.demand(3)
		.wrap(null)
		.strict()
		.argv;


let storeName = argv._[0];
let apiKey = argv._[1];
let password = argv._[2];

console.log(`Store Name: ${storeName}`);
console.log(`API Key: ${apiKey}`);
console.log(`Password: ${password}`);

let getUrl = `https://${apiKey}:${password}@${storeName}.myshopify.com/admin/blogs.json`;
	
request({
	method: "GET",
	uri: getUrl,
	json: true
},
function(err, httpResponse, body) {
	if(err) {
		console.log("Error: " + err);
		process.exit(1);
	}
	if(httpResponse.statusCode < 200 || httpResponse.statusCode > 299) {
		console.log("Error: " + httpResponse.statusMessage + " " + JSON.stringify(body));
		process.exit(1);
	}
	console.log(body);
});
