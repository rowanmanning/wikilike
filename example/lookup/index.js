'use strict';

const { readFile } = require('node:fs/promises');

// Note: in your own code you can replace this require with `@rowanmanning/wikilike`
const { LinkParser } = require('../..');

// Create a parser
const parser = new LinkParser({
	// Specify a link lookup function which loads from local JSON files
	linkLookup: (link) => {
		try {
			// Try loading a local JSON file which matches the link location
			const content = require(`${__dirname}/content/${link.location}.json`);

			// Update and return the link
			link.label = link.label || content.title;
			link.location = content.uri;
			return link;
		} catch (_error) {
			// Ignore the error and return the link with an extra classname
			link.label = link.label || link.location;
			link.location = `/${link.location}/create`;
			link.className = 'not-found';
			return link;
		}
	}
});

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
