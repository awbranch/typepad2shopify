const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');
const async = require('async');
const url = require('url');
const path = require('path');

function moveImages(source, newRoot) {
	console.log('Move Images: ' + source + ' -> ' + newRoot);
}

module.exports = moveImages;
