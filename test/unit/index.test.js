'use strict';

const assert = require('proclaim');

describe('index', () => {
	let index;
	let LinkParser;

	beforeEach(() => {
		index = require('../../index');
		LinkParser = require('../../lib/link-parser');
	});

	it('aliases `lib/link-parser`', () => {
		assert.strictEqual(index, LinkParser);
	});

});
