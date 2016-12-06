const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const path = require('path');

const argv = require('yargs')
		.usage("This script removes unnecessary the style tags, allowing Shopify to control the styles via CSS\n\n" +
				"Usage:   $0 <source-json> <dest-json>\n\n" +
				"Example: $0 blog.json blog-new.json\n" +
				"         Cleans the styles in blog.json and writes to blog-new.json\n\n" +
				"Example: $0 blog.json blog-new.json --domains www.foo.com www.bar.com\n" +
				"         Same as above removes any links to the old blog."
		)
		.option('domains', {
			describe: 'Specify any domains this blog came from. This is useful to remove links not used in shopify.',
			type: 'array'
		})
		.options('removeClasses', {
			describe: 'If specified will remove all classes',
			type: "boolean"
		})
		.options('removeStyles', {
			describe: 'If specified will remove all styles',
			type: "boolean"
		})
		.demand(2)
		.wrap(null)
		.strict()
		.argv;

console.log(argv);

let source = argv._[0];
let dest = argv._[1];
let domains = [];
if(argv.domains) {
	argv.domains.forEach(d => {
		domains.push('http://' + d);
		domains.push('https://' + d);
	});
}

let removeClasses = argv.removeClasses;
let removeStyles = argv.removeStyles;

cleanStyles(source, dest, removeClasses, removeStyles);

function cleanStyles(source, dest, removeClasses, removeStyles) {
	console.log('Remove Styles: ' + source + ' -> ' + dest);
	
	const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));
	const inlineRegex = /display:\s*inline/;
	
	articles.forEach(article => {
		let $ = cheerio.load(article.body);
		
		$('a').each(function () {
			
			let anchor = $(this);
			let href = anchor.attr('href');
			
			if(isInDomain(href, domains)) {
				console.log(`${href}`);
				
				// See if it has style="display: inline;"
				let style = anchor.attr('style');
				if(style && inlineRegex.test(style.toLowerCase())) {
					anchor.replaceWith(anchor.children());
				}
			}
		});
		
		if(removeClasses) {
			$('[class]').removeAttr('class');
		}
		
		if(removeStyles) {
			$('[style]').removeAttr('style');
		}
		
		
		article.body = $.html();
		
	});
	
	// Write articles to dest
	fs.writeFileSync(dest, JSON.stringify(articles, null, '\t'));

	console.log(`Success: wrote: ${dest}`);
}


function isInDomain(href, domains) {
	for(let i=0; i<domains.length; i++) {
		let d = domains[i];
		if(href.startsWith(d)) {
			return true;
		}
	}
	return false;
}