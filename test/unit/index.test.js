'use strict';

const index = require('../../index');
const LinkParser = require('../../lib/link-parser');

describe('index', () => {

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('aliases `lib/link-parser`', () => {
		expect(index).toStrictEqual(LinkParser);
	});

});
