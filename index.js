var yargs = require('yargs');
var typepadParser = require('./typepadParser');
var imageDownloader = require('./imageDownloader');

var argv = require('yargs')
		.usage('This script has several commands to help you convert a Typepad blog into a Shopify blog.\n\nUsage: $0 <command> [options]')
		
		.command("to-json <source> <dest>", "Reads a Typepad blog export txt file and writes to JSON file which is used in all subsequent commands.")
		.example('$0 to-json typepad.txt blog.json', 'Reads Typepad exported file and creates blog.json')
		
		.command("download-images <source> <dir>", "Downloads images in source and writes them to dir")
		.example('$0 download-images blog.json MyBlogImages/', 'Downloads all images blog.json to the directory MyBlogImages')
		
		.command("rename-images <source>", "")
		.demand(1, 2)
		.strict()
		.wrap(130)
		.argv;

var command = argv._[0];

switch(command) {
	case "to-json":
		typepadParser(argv.source, argv.dest);
		break;

case "download-images":
	imageDownloader(argv.source, argv.dir);
	break;
}


