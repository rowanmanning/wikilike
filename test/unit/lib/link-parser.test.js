'use strict';

describe('lib/link-parser', () => {
	let Hyperons;
	let log;
	let LinkParser;

	beforeEach(() => {
		jest.resetModules();
		Hyperons = require('hyperons');
		log = {
			error: jest.fn()
		};
		LinkParser = require('../../../lib/link-parser');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('new LinkParser(options)', () => {
		let defaultedOptions;
		let instance;
		let userOptions;

		beforeEach(() => {
			defaultedOptions = Object.assign({}, LinkParser.defaultOptions, {log});
			jest.spyOn(LinkParser, 'applyDefaultOptions').mockReturnValue(defaultedOptions);
			userOptions = {mockUserOptions: true};
			instance = new LinkParser(userOptions);
		});

		it('calls `LinkParser.applyDefaultOptions` with `options`', () => {
			expect(LinkParser.applyDefaultOptions).toHaveBeenCalledTimes(1);
			expect(LinkParser.applyDefaultOptions).toHaveBeenCalledWith(userOptions);
		});

		describe('.options', () => {

			it('is set to the defaulted options', () => {
				expect(instance.options).toStrictEqual(defaultedOptions);
			});

		});

		describe('.log', () => {

			it('is set to the defaulted `log` option', () => {
				expect(instance.log).toStrictEqual(defaultedOptions.log);
			});

		});

		describe('.parse(input)', () => {
			let returnValue;

			const testCases = [
				{
					name: 'valid link (basic, alone)',
					input: `[[hello]]`
				},
				{
					name: 'valid link (basic, alone, path)',
					input: `[[/example/path]]`
				},
				{
					name: 'valid link (basic, text before)',
					input: `this is text [[hello]]`
				},
				{
					name: 'valid link (basic, text after)',
					input: `[[hello]] this is text`
				},
				{
					name: 'valid link (basic, text around)',
					input: `this is text [[hello]] this is text`
				},
				{
					name: 'valid link (basic, alone, escaped opener)',
					input: `[[hello\\[world]]`
				},
				{
					name: 'valid link (basic, alone, escaped closer)',
					input: `[[hello\\]world]]`
				},
				{
					name: 'valid link (basic, alone, escaped escape)',
					input: `[[hello\\\\world]]`
				},
				{
					name: 'valid link (basic, alone, escaped divider)',
					input: `[[hello\\|world]]`
				},
				{
					name: 'valid link (basic, alone, escaped command)',
					input: `[[command\\>hello]]`
				},
				{
					name: 'valid link (basic, alone, extra opener)',
					input: `[[[hello]]`
				},
				{
					name: 'valid link (basic, alone, extra closer)',
					input: `[[hello]]]`
				},
				{
					name: 'valid link (basic, alone, extra opener and closer)',
					input: `[[[hello]]]`
				},
				{
					name: 'valid links (basic, text around)',
					input: `this is text [[hello]] this is text [[world]] this is text`
				},
				{
					name: 'valid links (basic, spaced)',
					input: `[[ hello ]] [[  world  ]] [[   and   ]] [[\tmoon\t]]`
				},
				{
					name: 'valid link (labelled, alone)',
					input: `[[hello|hi]]`
				},
				{
					name: 'valid link (labelled, alone, path)',
					input: `[[/example/path|example]]`
				},
				{
					name: 'valid link (labelled, text before)',
					input: `this is text [[hello|hi]]`
				},
				{
					name: 'valid link (labelled, text after)',
					input: `[[hello|hi]] this is text`
				},
				{
					name: 'valid link (labelled, text around)',
					input: `this is text [[hello|hi]] this is text`
				},
				{
					name: 'valid link (labelled, alone, escaped opener)',
					input: `[[hello world|hi\\[planet]]`
				},
				{
					name: 'valid link (labelled, alone, escaped closer)',
					input: `[[hello world|hi\\]planet]]`
				},
				{
					name: 'valid link (labelled, alone, escaped escape)',
					input: `[[hello world|hi\\\\planet]]`
				},
				{
					name: 'valid link (labelled, alone, escaped divider)',
					input: `[[hello world|hi\\|planet]]`
				},
				{
					name: 'valid link (labelled, alone, escaped command)',
					input: `[[hello world|hi\\>planet]]`
				},
				{
					name: 'valid link (labelled, alone, extra opener)',
					input: `[[[hello|hi]]`
				},
				{
					name: 'valid link (labelled, alone, extra closer)',
					input: `[[hello|hi]]]`
				},
				{
					name: 'valid link (labelled, alone, extra opener and closer)',
					input: `[[[hello|hi]]]`
				},
				{
					name: 'valid link (labelled, empty label)',
					input: `[[hello|]]`
				},
				{
					name: 'valid links (labelled, text around)',
					input: `this is text [[hello|hi]] this is text [[world|earth]] this is text`
				},
				{
					name: 'valid links (labelled, spaced)',
					input: `[[ hello | hi ]] [[  world  |  earth  ]] [[   and   |   &   ]] [[\tmoon\t|\tsatellite\t]]`
				},
				{
					name: 'valid link (basic, default command, alone)',
					input: `[[>hello]]`
				},
				{
					name: 'valid link (basic, specified command, alone)',
					input: `[[mock>hello]]`
				},
				{
					name: 'valid link (basic, specified command, alone, spaced)',
					input: `[[  mock  >  hello  ]]`
				},
				{
					name: 'valid link (labelled, default command, alone)',
					input: `[[>hello|hi]]`
				},
				{
					name: 'valid link (labelled, specified command, alone)',
					input: `[[mock>hello|hi]]`
				},
				{
					name: 'valid link (labelled, specified command, alone, spaced)',
					input: `[[  mock  >  hello  |  hi  ]]`
				},
				{
					name: 'valid link (labelled, command in label, alone)',
					input: `[[hello|mock>hi]]`
				},
				{
					name: 'invalid link (basic, no location)',
					input: `[[  ]]`
				},
				{
					name: 'invalid link (basic, single opener and closer)',
					input: `[]`
				},
				{
					name: 'invalid link (basic, escaped inner opener)',
					input: `[\\[hello]]`
				},
				{
					name: 'invalid link (basic, escaped inner closer)',
					input: `[[hello\\]]`
				},
				{
					name: 'invalid links (basic, line break)',
					input: `[[\nhello]] [[hello\n]] [[\r\nhello]] [[hello\r\n]]`
				},
				{
					name: 'invalid links (basic, broken openers)',
					input: `[ [hello]] [hello]] [a[hello]] [[a[hello]]`
				},
				{
					name: 'invalid links (basic, broken closer)',
					input: `[[hello] ] [[hello] [[hello]a] [[hello]a]]`
				},
				{
					name: 'invalid link (labelled, no location)',
					input: `[[  |hi]]`
				},
				{
					name: 'invalid link (labelled, extra pipe)',
					input: `[[hello|hi|hey]]`
				},
				{
					name: 'invalid link (labelled, escaped inner opener)',
					input: `[\\[hello|hi]]`
				},
				{
					name: 'invalid link (labelled, escaped inner closer)',
					input: `[[hello|hi\\]]`
				},
				{
					name: 'invalid links (labelled, line break)',
					input: `[[\nhello|hi]] [[hello|hi\n]] [[hello\n|\nhi]] [[\r\nhello|hi]] [[hello|hi\r\n]] [[hello\r\n|\r\nhi]]`
				},
				{
					name: 'invalid links (labelled, broken opener)',
					input: `[ [hello|hi]] [hello|hi]] [a[hello|hi]] [[a[hello|hi]]`
				},
				{
					name: 'invalid links (labelled, broken closer)',
					input: `[[hello|hi] ] [[hello|hi] [[hello|hi]a] [[hello|hi]a]]`
				}
			];

			for (const testCase of testCases) {
				describe(`for input "${testCase.name}"`, () => {

					beforeEach(() => {
						returnValue = instance.parse(testCase.input);
					});

					it('returns the expected tokens', () => {
						expect(returnValue).toMatchSnapshot();
					});

				});
			}

		});

		describe('.render(input, linkTransform)', () => {
			let linkTransform;
			let resolvedValue;
			let tokens;

			beforeEach(async () => {
				tokens = [
					{
						type: 'link',
						raw: 'mock-link-1'
					},
					{
						type: 'text',
						raw: '\nmock-text\n'
					},
					{
						type: 'link',
						raw: 'mock-link-2'
					}
				];
				jest.spyOn(instance, 'parse').mockReturnValue(tokens);
				linkTransform = jest.fn()
					.mockReturnValueOnce('mock-link-transform-1')
					.mockReturnValueOnce('mock-link-transform-2');
				instance.options.linkLookup = jest.fn()
					.mockResolvedValueOnce({
						mockLinkLookupResult: 1
					})
					.mockResolvedValueOnce({
						mockLinkLookupResult: 2
					});
				resolvedValue = await instance.render('mock-input', linkTransform);
			});

			it('parses the input', () => {
				expect(instance.parse).toHaveBeenCalledTimes(1);
				expect(instance.parse).toHaveBeenCalledWith('mock-input');
			});

			it('looks up each of the links', () => {
				expect(instance.options.linkLookup).toHaveBeenCalledTimes(2);
				expect(instance.options.linkLookup).toHaveBeenCalledWith(tokens[0]);
				expect(instance.options.linkLookup).toHaveBeenCalledWith(tokens[2]);
			});

			it('transforms each of the looked up values', () => {
				expect(linkTransform).toHaveBeenCalledTimes(2);
				expect(linkTransform).toHaveBeenCalledWith({
					mockLinkLookupResult: 1
				});
				expect(linkTransform).toHaveBeenCalledWith({
					mockLinkLookupResult: 2
				});
			});

			it('resolves with the input with links rendered using the transform', () => {
				expect(resolvedValue).toStrictEqual('mock-link-transform-1\nmock-text\nmock-link-transform-2');
			});

			describe('when one of the looked up links has an `override` property', () => {

				beforeEach(async () => {
					linkTransform.mockClear();
					linkTransform = jest.fn().mockReturnValueOnce('mock-link-transform-1');
					instance.options.linkLookup = jest.fn()
						.mockResolvedValueOnce({
							mockLinkLookupResult: 1
						})
						.mockResolvedValueOnce({
							mockLinkLookupResult: 2,
							override: 'mock-override'
						});
					resolvedValue = await instance.render('mock-input', linkTransform);
				});

				it('transforms only the looked up values which do not have overrides', () => {
					expect(linkTransform).toHaveBeenCalledTimes(1);
					expect(linkTransform).toHaveBeenCalledWith({
						mockLinkLookupResult: 1
					});
				});

				it('resolves with the input with links rendered using the transform', () => {
					expect(resolvedValue).toStrictEqual('mock-link-transform-1\nmock-text\nmock-override');
				});

			});

			describe('when one of the link lookup errors', () => {
				let linkLookupError;

				beforeEach(async () => {
					instance.log.error.mockClear();
					linkTransform.mockClear();
					linkTransform = jest.fn().mockReturnValueOnce('mock-link-transform-1');
					linkLookupError = new Error('mock link lookup error');
					instance.options.linkLookup = jest.fn()
						.mockResolvedValueOnce({
							mockLinkLookupResult: 1
						})
						.mockRejectedValueOnce(linkLookupError);
					resolvedValue = await instance.render('mock-input', linkTransform);
				});

				it('transforms only the looked up values which do not error', () => {
					expect(linkTransform).toHaveBeenCalledTimes(1);
					expect(linkTransform).toHaveBeenCalledWith({
						mockLinkLookupResult: 1
					});
				});

				it('logs the error', () => {
					expect(instance.log.error).toHaveBeenCalledTimes(1);
					expect(instance.log.error).toHaveBeenCalledWith(`Error processing link "mock-link-2":`, linkLookupError);
				});

				it('resolves with the input with links rendered using the transform', () => {
					expect(resolvedValue).toStrictEqual('mock-link-transform-1\nmock-text\nmock-link-2');
				});

			});

		});

		describe('.toHTML(input)', () => {
			let resolvedValue;

			beforeEach(async () => {
				jest.spyOn(instance, 'render').mockResolvedValue('mock-render');
				resolvedValue = await instance.toHTML('mock-input');
			});

			it('calls the `render` method with the input and a function', () => {
				expect(instance.render).toHaveBeenCalledTimes(1);
				expect(instance.render.mock.calls[0][0]).toStrictEqual('mock-input');
				expect(instance.render.mock.calls[0][1]).toBeInstanceOf(Function);
			});

			it('resolves with the result of the render', () => {
				expect(resolvedValue).toStrictEqual('mock-render');
			});

			describe('render `linkTransform` argument', () => {
				let link;
				let returnValue;

				beforeEach(() => {
					jest.spyOn(Object, 'assign');
					link = {
						command: 'mock-command',
						label: 'mock-label',
						location: 'mock-location',
						raw: 'mock-raw',
						type: 'mock-type',
						extra: 'mock-extra'
					};
					returnValue = instance.render.mock.calls[0][1](link);
				});

				afterEach(() => {
					Object.assign.mockRestore();
				});

				it('calls `Hyperons.createElement` with information to construct an `a` element', () => {
					expect(Hyperons.createElement).toHaveBeenCalledTimes(1);
					expect(Hyperons.createElement).toHaveBeenCalledWith('a', {
						href: 'mock-location',
						extra: 'mock-extra'
					}, 'mock-label');
				});

				it('calls `Hyperons.renderToString` with the created element', () => {
					expect(Hyperons.renderToString).toHaveBeenCalledTimes(1);
					expect(Hyperons.renderToString).toHaveBeenCalledWith(Hyperons.createElement.mock.results[0].value);
				});

				it('returns the rendered string', () => {
					expect(returnValue).toStrictEqual(Hyperons.renderToString.mock.results[0].value);
				});

				describe('when the passed in `link` does not have a label', () => {

					beforeEach(() => {
						delete link.label;
						Hyperons.createElement.mockClear();
						returnValue = instance.render.mock.calls[0][1](link);
					});

					it('calls `Hyperons.createElement` with the location in place of a label', () => {
						expect(Hyperons.createElement).toHaveBeenCalledTimes(1);
						expect(Hyperons.createElement).toHaveBeenCalledWith('a', {
							href: 'mock-location',
							extra: 'mock-extra'
						}, 'mock-location');
					});

				});

			});

		});

		describe('when all of the customisation options are set', () => {

			beforeEach(() => {
				instance.options.openCharacter = '{';
				instance.options.closeCharacter = '}';
				instance.options.commandCharacter = '👑';
				instance.options.defaultCommand = 'mock';
				instance.options.dividerCharacter = '*';
				instance.options.escapeCharacter = '~';
			});

			describe('.parse(input)', () => {
				let returnValue;

				const testCases = [
					{
						name: 'valid link (basic)',
						input: `{{hello}}`
					},
					{
						name: 'valid link (basic, escaped)',
						input: `{{hello~{world}}`
					},
					{
						name: 'valid link (basic, default command)',
						input: `{{👑hello}}`
					},
					{
						name: 'valid link (basic, specified command)',
						input: `{{hi👑hello}}`
					},
					{
						name: 'valid link (labelled, alone)',
						input: `{{hello*hi}}`
					},
					{
						name: 'standard link',
						input: `[[hello]]`
					}
				];

				for (const testCase of testCases) {
					describe(`for input "${testCase.name}"`, () => {

						beforeEach(() => {
							returnValue = instance.parse(testCase.input);
						});

						it('returns the expected tokens', () => {
							expect(returnValue).toMatchSnapshot();
						});

					});
				}

			});

		});

	});

	describe('.defaultOptions', () => {

		it('is an object', () => {
			expect(LinkParser.defaultOptions).not.toBeNull();
			expect(typeof LinkParser.defaultOptions).toStrictEqual('object');
		});

		describe('.closeCharacter', () => {

			it('is set to the expected string value', () => {
				expect(LinkParser.defaultOptions.closeCharacter).toStrictEqual(']');
			});

		});

		describe('.commandCharacter', () => {

			it('is set to the expected string value', () => {
				expect(LinkParser.defaultOptions.commandCharacter).toStrictEqual('>');
			});

		});

		describe('.defaultCommand', () => {

			it('is set to the expected string value', () => {
				expect(LinkParser.defaultOptions.defaultCommand).toStrictEqual('cmd');
			});

		});

		describe('.dividerCharacter', () => {

			it('is set to the expected string value', () => {
				expect(LinkParser.defaultOptions.dividerCharacter).toStrictEqual('|');
			});

		});

		describe('.escapeCharacter', () => {

			it('is set to the expected string value', () => {
				expect(LinkParser.defaultOptions.escapeCharacter).toStrictEqual('\\');
			});

		});

		describe('.openCharacter', () => {

			it('is set to the expected string value', () => {
				expect(LinkParser.defaultOptions.openCharacter).toStrictEqual('[');
			});

		});

		describe('.log', () => {

			it('is the global `console` object', () => {
				expect(LinkParser.defaultOptions.log).toStrictEqual(console);
			});

		});

		describe('.linkLookup', () => {

			it('is a function which returns its first argument', () => {
				const linkLookup = LinkParser.defaultOptions.linkLookup;
				expect(linkLookup).toBeInstanceOf(Function);
				expect(linkLookup('mock')).toStrictEqual('mock');
			});

		});

	});

	describe('.applyDefaultOptions(options)', () => {
		let defaultedOptions;
		let returnValue;
		let userOptions;

		beforeEach(() => {
			userOptions = {mockUserOptions: true};
			defaultedOptions = {
				mockDefaultedOptions: true
			};
			jest.spyOn(Object, 'assign').mockReturnValue(defaultedOptions);
			returnValue = LinkParser.applyDefaultOptions(userOptions);
		});

		afterEach(() => {
			Object.assign.mockRestore();
		});

		it('defaults the `options`', () => {
			expect(Object.assign).toHaveBeenCalledTimes(1);
			expect(Object.assign).toHaveBeenCalledWith({}, LinkParser.defaultOptions, userOptions);
		});

		it('returns the defaulted options with some transformations', () => {
			expect(returnValue).toStrictEqual(defaultedOptions);
		});

	});

});
