const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const path = require('path');

const argv = require('yargs')
		.usage("This script removes unnecessary the style and class attributes, allowing Shopify to control the styles via CSS\n\n" +
				"Usage:   $0 <source-json> <dest-json>\n\n" +
				"Example: $0 blog.json blog-new.json --removeClasses --removeStyles\n" +
				"         Cleans the styles in blog.json and writes to blog-new.json\n\n" +
				"Example: $0 blog.json blog-new.json --removeImageLinks --domains www.foo.com www.bar.com\n" +
				"         Same as above removes any links to the old blog."
		)
		.options('removeImageLinks', {
			describe: 'If specified removes the link wrappers around images. Requires that domains is also specified.',
			type: "boolean"
		})
		.options('removeClasses', {
			describe: 'If specified will remove all classes',
			type: "boolean"
		})
		.options('removeStyles', {
			describe: 'If specified will remove all styles',
			type: "boolean"
		})
		.option('domains', {
			describe: 'Specify any domains this blog came from.',
			type: 'array'
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
let removeImageLinks = argv.removeImageLinks;

if(removeImageLinks && domains.length === 0) {
	console.log("You must specifying domains when specifying removeImageLinks");
	exit(1);
}

console.log('Remove Styles: ' + source + ' -> ' + dest);

const articles = JSON.parse(fs.readFileSync(source, 'utf-8'));
const inlineRegex = /display:\s*inline/;

articles.forEach(article => {
	let $ = cheerio.load(article.body);
	
	if(removeImageLinks) {
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
	}
	
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


function isInDomain(href, domains) {
	for(let i=0; i<domains.length; i++) {
		let d = domains[i];
		if(href.startsWith(d)) {
			return true;
		}
	}
	return false;
}