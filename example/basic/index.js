'use strict';

const { readFile } = require('node:fs/promises');

// Note: in your own code you can replace this require with `@rowanmanning/wikilike`
const { LinkParser } = require('../..');

// Create a parser
const parser = new LinkParser();

// Rendering happens asynchronously, so for this example we
// wrap calls in an immediately executed function
(async () => {
	// Load the input from a file
	const input = await readFile(`${__dirname}/input.txt`, 'utf-8');

	// Convert links found in the input to HTML
	const output = await parser.toHTML(input);

	// Log the input and output together
	console.log(`\nINPUT:\n${input}`);
	console.log('----------');
	console.log(`\nOUTPUT:\n${output}`);
})();
