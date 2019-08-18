'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/link-parser', () => {
	let Hyperons;
	let log;
	let LinkParser;

	beforeEach(() => {
		Hyperons = require('../mock/npm/hyperons');
		mockery.registerMock('hyperons', Hyperons);
		log = {
			error: sinon.spy()
		};
		LinkParser = require('../../../lib/link-parser');
	});

	describe('new LinkParser(options)', () => {
		let defaultedOptions;
		let instance;
		let userOptions;

		beforeEach(() => {
			defaultedOptions = Object.assign({}, LinkParser.defaultOptions, {log});
			sinon.stub(LinkParser, 'applyDefaultOptions').returns(defaultedOptions);
			userOptions = {mockUserOptions: true};
			instance = new LinkParser(userOptions);
		});

		it('calls `LinkParser.applyDefaultOptions` with `options`', () => {
			assert.calledOnce(LinkParser.applyDefaultOptions);
			assert.calledWith(LinkParser.applyDefaultOptions, userOptions);
		});

		describe('.options', () => {

			it('is set to the defaulted options', () => {
				assert.strictEqual(instance.options, defaultedOptions);
			});

		});

		describe('.log', () => {

			it('is set to the defaulted `log` option', () => {
				assert.strictEqual(instance.log, defaultedOptions.log);
			});

		});

		describe('.parse(input)', () => {
			let returnValue;

			const testCases = [
				{
					name: 'valid link (basic, alone)',
					input: '[[hello]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, path)',
					input: '[[/example/path]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"/example/path","label":null,"raw":"[[/example/path]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, text before)',
					input: 'this is text [[hello]]',
					expectedResult: `[{"type":"text","raw":"this is text "},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, text after)',
					input: '[[hello]] this is text',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":" this is text"}]`
				},
				{
					name: 'valid link (basic, text around)',
					input: 'this is text [[hello]] this is text',
					expectedResult: `[{"type":"text","raw":"this is text "},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":" this is text"}]`
				},
				{
					name: 'valid link (basic, alone, escaped opener)',
					input: '[[hello\\[world]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello[world","label":null,"raw":"[[hello\\\\[world]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, escaped closer)',
					input: '[[hello\\]world]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello]world","label":null,"raw":"[[hello\\\\]world]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, escaped escape)',
					input: '[[hello\\\\world]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello\\\\world","label":null,"raw":"[[hello\\\\\\\\world]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, escaped divider)',
					input: '[[hello\\|world]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello|world","label":null,"raw":"[[hello\\\\|world]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, escaped command)',
					input: '[[command\\>hello]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"command>hello","label":null,"raw":"[[command\\\\>hello]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, extra opener)',
					input: '[[[hello]]',
					expectedResult: `[{"type":"text","raw":"["},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, alone, extra closer)',
					input: '[[hello]]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":"]"}]`
				},
				{
					name: 'valid link (basic, alone, extra opener and closer)',
					input: '[[[hello]]]',
					expectedResult: `[{"type":"text","raw":"["},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":"]"}]`
				},
				{
					name: 'valid links (basic, text around)',
					input: 'this is text [[hello]] this is text [[world]] this is text',
					expectedResult: `[{"type":"text","raw":"this is text "},{"type":"link","location":"hello","label":null,"raw":"[[hello]]"},{"type":"text","raw":" this is text "},{"type":"link","location":"world","label":null,"raw":"[[world]]"},{"type":"text","raw":" this is text"}]`
				},
				{
					name: 'valid links (basic, spaced)',
					input: '[[ hello ]] [[  world  ]] [[   and   ]] [[\tmoon\t]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[ hello ]]"},{"type":"text","raw":" "},{"type":"link","location":"world","label":null,"raw":"[[  world  ]]"},{"type":"text","raw":" "},{"type":"link","location":"and","label":null,"raw":"[[   and   ]]"},{"type":"text","raw":" "},{"type":"link","location":"moon","label":null,"raw":"[[\\tmoon\\t]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone)',
					input: '[[hello|hi]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, path)',
					input: '[[/example/path|example]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"/example/path","label":"example","raw":"[[/example/path|example]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, text before)',
					input: 'this is text [[hello|hi]]',
					expectedResult: `[{"type":"text","raw":"this is text "},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, text after)',
					input: '[[hello|hi]] this is text',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":" this is text"}]`
				},
				{
					name: 'valid link (labelled, text around)',
					input: 'this is text [[hello|hi]] this is text',
					expectedResult: `[{"type":"text","raw":"this is text "},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":" this is text"}]`
				},
				{
					name: 'valid link (labelled, alone, escaped opener)',
					input: '[[hello world|hi\\[planet]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello world","label":"hi[planet","raw":"[[hello world|hi\\\\[planet]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, escaped closer)',
					input: '[[hello world|hi\\]planet]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello world","label":"hi]planet","raw":"[[hello world|hi\\\\]planet]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, escaped escape)',
					input: '[[hello world|hi\\\\planet]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello world","label":"hi\\\\planet","raw":"[[hello world|hi\\\\\\\\planet]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, escaped divider)',
					input: '[[hello world|hi\\|planet]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello world","label":"hi|planet","raw":"[[hello world|hi\\\\|planet]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, escaped command)',
					input: '[[hello world|hi\\>planet]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello world","label":"hi>planet","raw":"[[hello world|hi\\\\>planet]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, extra opener)',
					input: '[[[hello|hi]]',
					expectedResult: `[{"type":"text","raw":"["},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, alone, extra closer)',
					input: '[[hello|hi]]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":"]"}]`
				},
				{
					name: 'valid link (labelled, alone, extra opener and closer)',
					input: '[[[hello|hi]]]',
					expectedResult: `[{"type":"text","raw":"["},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":"]"}]`
				},
				{
					name: 'valid link (labelled, empty label)',
					input: '[[hello|]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[hello|]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid links (labelled, text around)',
					input: 'this is text [[hello|hi]] this is text [[world|earth]] this is text',
					expectedResult: `[{"type":"text","raw":"this is text "},{"type":"link","location":"hello","label":"hi","raw":"[[hello|hi]]"},{"type":"text","raw":" this is text "},{"type":"link","location":"world","label":"earth","raw":"[[world|earth]]"},{"type":"text","raw":" this is text"}]`
				},
				{
					name: 'valid links (labelled, spaced)',
					input: '[[ hello | hi ]] [[  world  |  earth  ]] [[   and   |   &   ]] [[\tmoon\t|\tsatellite\t]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[ hello | hi ]]"},{"type":"text","raw":" "},{"type":"link","location":"world","label":"earth","raw":"[[  world  |  earth  ]]"},{"type":"text","raw":" "},{"type":"link","location":"and","label":"&","raw":"[[   and   |   &   ]]"},{"type":"text","raw":" "},{"type":"link","location":"moon","label":"satellite","raw":"[[\\tmoon\\t|\\tsatellite\\t]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, default command, alone)',
					input: '[[>hello]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[>hello]]","command":"cmd"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, specified command, alone)',
					input: '[[mock>hello]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[mock>hello]]","command":"mock"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (basic, specified command, alone, spaced)',
					input: '[[  mock  >  hello  ]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"[[  mock  >  hello  ]]","command":"mock"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, default command, alone)',
					input: '[[>hello|hi]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[>hello|hi]]","command":"cmd"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, specified command, alone)',
					input: '[[mock>hello|hi]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[mock>hello|hi]]","command":"mock"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, specified command, alone, spaced)',
					input: '[[  mock  >  hello  |  hi  ]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"[[  mock  >  hello  |  hi  ]]","command":"mock"},{"type":"text","raw":""}]`
				},
				{
					name: 'valid link (labelled, command in label, alone)',
					input: '[[hello|mock>hi]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"mock>hi","raw":"[[hello|mock>hi]]"},{"type":"text","raw":""}]`
				},
				{
					name: 'invalid link (basic, no location)',
					input: '[[  ]]',
					expectedResult: `[{"type":"text","raw":"[[  ]]"}]`
				},
				{
					name: 'invalid link (basic, single opener and closer)',
					input: '[]',
					expectedResult: `[{"type":"text","raw":"[]"}]`
				},
				{
					name: 'invalid link (basic, escaped inner opener)',
					input: '[\\[hello]]',
					expectedResult: `[{"type":"text","raw":"[\\\\[hello]]"}]`
				},
				{
					name: 'invalid link (basic, escaped inner closer)',
					input: '[[hello\\]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","state":"closing","location":"hello]","label":"","raw":"[[hello\\\\]]"}]`
				},
				{
					name: 'invalid links (basic, line break)',
					input: '[[\nhello]] [[hello\n]] [[\r\nhello]] [[hello\r\n]]',
					expectedResult: `[{"type":"text","raw":"[[\\nhello]] [[hello\\n]] [[\\r\\nhello]] [[hello\\r\\n]]"}]`
				},
				{
					name: 'invalid links (basic, broken openers)',
					input: '[ [hello]] [hello]] [a[hello]] [[a[hello]]',
					expectedResult: `[{"type":"text","raw":"[ [hello]] [hello]] [a[hello]] [[a[hello]]"}]`
				},
				{
					name: 'invalid links (basic, broken closer)',
					input: '[[hello] ] [[hello] [[hello]a] [[hello]a]]',
					expectedResult: `[{"type":"text","raw":"[[hello] ] [[hello] [[hello]a] [[hello]a]]"}]`
				},
				{
					name: 'invalid link (labelled, no location)',
					input: '[[  |hi]]',
					expectedResult: `[{"type":"text","raw":"[[  |hi]]"}]`
				},
				{
					name: 'invalid link (labelled, extra pipe)',
					input: '[[hello|hi|hey]]',
					expectedResult: `[{"type":"text","raw":"[[hello|hi|hey]]"}]`
				},
				{
					name: 'invalid link (labelled, escaped inner opener)',
					input: '[\\[hello|hi]]',
					expectedResult: `[{"type":"text","raw":"[\\\\[hello|hi]]"}]`
				},
				{
					name: 'invalid link (labelled, escaped inner closer)',
					input: '[[hello|hi\\]]',
					expectedResult: `[{"type":"text","raw":""},{"type":"link","state":"closing","location":"hello","label":"hi]","raw":"[[hello|hi\\\\]]"}]`
				},
				{
					name: 'invalid links (labelled, line break)',
					input: '[[\nhello|hi]] [[hello|hi\n]] [[hello\n|\nhi]] [[\r\nhello|hi]] [[hello|hi\r\n]] [[hello\r\n|\r\nhi]]',
					expectedResult: `[{"type":"text","raw":"[[\\nhello|hi]] [[hello|hi\\n]] [[hello\\n|\\nhi]] [[\\r\\nhello|hi]] [[hello|hi\\r\\n]] [[hello\\r\\n|\\r\\nhi]]"}]`
				},
				{
					name: 'invalid links (labelled, broken opener)',
					input: '[ [hello|hi]] [hello|hi]] [a[hello|hi]] [[a[hello|hi]]',
					expectedResult: `[{"type":"text","raw":"[ [hello|hi]] [hello|hi]] [a[hello|hi]] [[a[hello|hi]]"}]`
				},
				{
					name: 'invalid links (labelled, broken closer)',
					input: '[[hello|hi] ] [[hello|hi] [[hello|hi]a] [[hello|hi]a]]',
					expectedResult: `[{"type":"text","raw":"[[hello|hi] ] [[hello|hi] [[hello|hi]a] [[hello|hi]a]]"}]`
				}
			];

			for (const testCase of testCases) {
				describe(`for input "${testCase.name}"`, () => {

					beforeEach(() => {
						returnValue = instance.parse(testCase.input);
					});

					it('returns the expected tokens', () => {
						assert.strictEqual(JSON.stringify(returnValue), testCase.expectedResult);
					});

				});
			}

		});

		describe('.render(input, linkTransform, lookupContext)', () => {
			let linkTransform;
			let lookupContext;
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
				lookupContext = {
					mockLookupContext: true
				};
				sinon.stub(instance, 'parse').returns(tokens);
				linkTransform = sinon.stub();
				linkTransform.onCall(0).returns('mock-link-transform-1');
				linkTransform.onCall(1).returns('mock-link-transform-2');
				instance.options.linkLookup = sinon.stub();
				instance.options.linkLookup.onCall(0).resolves({
					mockLinkLookupResult: 1
				});
				instance.options.linkLookup.onCall(1).resolves({
					mockLinkLookupResult: 2
				});
				resolvedValue = await instance.render('mock-input', linkTransform, lookupContext);
			});

			it('parses the input', () => {
				assert.calledOnce(instance.parse);
				assert.calledWith(instance.parse, 'mock-input');
			});

			it('looks up each of the links', () => {
				assert.calledTwice(instance.options.linkLookup);
				assert.calledWith(instance.options.linkLookup, tokens[0], lookupContext);
				assert.calledWith(instance.options.linkLookup, tokens[2], lookupContext);
			});

			it('transforms each of the looked up values', () => {
				assert.calledTwice(linkTransform);
				assert.calledWith(linkTransform, {
					mockLinkLookupResult: 1
				});
				assert.calledWith(linkTransform, {
					mockLinkLookupResult: 2
				});
			});

			it('resolves with the input with links rendered using the transform', () => {
				assert.strictEqual(resolvedValue, 'mock-link-transform-1\nmock-text\nmock-link-transform-2');
			});

			describe('when `lookupContext` is not defined', () => {

				beforeEach(async () => {
					linkTransform.resetHistory();
					instance.options.linkLookup.resetHistory();
					resolvedValue = await instance.render('mock-input', linkTransform);
				});

				it('looks up each of the links with a default lookup context', () => {
					assert.calledTwice(instance.options.linkLookup);
					assert.calledWith(instance.options.linkLookup, tokens[0], {});
					assert.calledWith(instance.options.linkLookup, tokens[2], {});
				});

			});

			describe('when one of the looked up links has an `override` property', () => {

				beforeEach(async () => {
					linkTransform = sinon.stub();
					linkTransform.onCall(0).returns('mock-link-transform-1');
					instance.options.linkLookup = sinon.stub();
					instance.options.linkLookup.onCall(0).resolves({
						mockLinkLookupResult: 1
					});
					instance.options.linkLookup.onCall(1).resolves({
						mockLinkLookupResult: 2,
						override: 'mock-override'
					});
					resolvedValue = await instance.render('mock-input', linkTransform, lookupContext);
				});

				it('transforms only the looked up values which do not have overrides', () => {
					assert.calledOnce(linkTransform);
					assert.calledWith(linkTransform, {
						mockLinkLookupResult: 1
					});
				});

				it('resolves with the input with links rendered using the transform', () => {
					assert.strictEqual(resolvedValue, 'mock-link-transform-1\nmock-text\nmock-override');
				});

			});

			describe('when one of the link lookup errors', () => {
				let linkLookupError;

				beforeEach(async () => {
					instance.log.error.resetHistory();
					linkTransform = sinon.stub();
					linkTransform.onCall(0).returns('mock-link-transform-1');
					linkLookupError = new Error('mock link lookup error');
					instance.options.linkLookup = sinon.stub();
					instance.options.linkLookup.onCall(0).resolves({
						mockLinkLookupResult: 1
					});
					instance.options.linkLookup.onCall(1).rejects(linkLookupError);
					resolvedValue = await instance.render('mock-input', linkTransform, lookupContext);
				});

				it('transforms only the looked up values which do not error', () => {
					assert.calledOnce(linkTransform);
					assert.calledWith(linkTransform, {
						mockLinkLookupResult: 1
					});
				});

				it('logs the error', () => {
					assert.calledOnce(instance.log.error);
					assert.calledWith(instance.log.error, `Error processing link "mock-link-2":`, linkLookupError);
				});

				it('resolves with the input with links rendered using the transform', () => {
					assert.strictEqual(resolvedValue, 'mock-link-transform-1\nmock-text\nmock-link-2');
				});

			});

		});

		describe('.toHTML(input, lookupContext)', () => {
			let lookupContext;
			let resolvedValue;

			beforeEach(async () => {
				lookupContext = {
					mockLookupContext: true
				};
				sinon.stub(instance, 'render').resolves('mock-render');
				resolvedValue = await instance.toHTML('mock-input', lookupContext);
			});

			it('calls the `render` method with the input, a function, and the lookup context', () => {
				assert.calledOnce(instance.render);
				assert.strictEqual(instance.render.firstCall.args[0], 'mock-input');
				assert.isFunction(instance.render.firstCall.args[1]);
				assert.strictEqual(instance.render.firstCall.args[2], lookupContext);
			});

			it('resolves with the result of the render', () => {
				assert.strictEqual(resolvedValue, 'mock-render');
			});

			describe('render `linkTransform` argument', () => {
				let link;
				let returnValue;

				beforeEach(() => {
					sinon.spy(Object, 'assign');
					link = {
						command: 'mock-command',
						label: 'mock-label',
						location: 'mock-location',
						raw: 'mock-raw',
						type: 'mock-type',
						extra: 'mock-extra'
					};
					returnValue = instance.render.firstCall.args[1](link);
				});

				it('calls `Hyperons.createElement` with information to construct an `a` element', () => {
					assert.calledOnce(Hyperons.createElement);
					assert.calledWith(Hyperons.createElement, 'a', {
						href: 'mock-location',
						extra: 'mock-extra'
					}, 'mock-label');
				});

				it('calls `Hyperons.renderToString` with the created element', () => {
					assert.calledOnce(Hyperons.renderToString);
					assert.calledWith(Hyperons.renderToString, Hyperons.createElement.firstCall.returnValue);
				});

				it('returns the rendered string', () => {
					assert.strictEqual(returnValue, Hyperons.renderToString.firstCall.returnValue);
				});

				describe('when the passed in `link` does not have a label', () => {

					beforeEach(() => {
						delete link.label;
						Hyperons.createElement.resetHistory();
						returnValue = instance.render.firstCall.args[1](link);
					});

					it('calls `Hyperons.createElement` with the location in place of a label', () => {
						assert.calledOnce(Hyperons.createElement);
						assert.calledWith(Hyperons.createElement, 'a', {
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
						input: '{{hello}}',
						expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"{{hello}}"},{"type":"text","raw":""}]`
					},
					{
						name: 'valid link (basic, escaped)',
						input: '{{hello~{world}}',
						expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello{world","label":null,"raw":"{{hello~{world}}"},{"type":"text","raw":""}]`
					},
					{
						name: 'valid link (basic, default command)',
						input: '{{👑hello}}',
						expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"{{👑hello}}","command":"mock"},{"type":"text","raw":""}]`
					},
					{
						name: 'valid link (basic, specified command)',
						input: '{{hi👑hello}}',
						expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":null,"raw":"{{hi👑hello}}","command":"hi"},{"type":"text","raw":""}]`
					},
					{
						name: 'valid link (labelled, alone)',
						input: '{{hello*hi}}',
						expectedResult: `[{"type":"text","raw":""},{"type":"link","location":"hello","label":"hi","raw":"{{hello*hi}}"},{"type":"text","raw":""}]`
					},
					{
						name: 'standard link',
						input: '[[hello]]',
						expectedResult: `[{"type":"text","raw":"[[hello]]"}]`
					}
				];

				for (const testCase of testCases) {
					describe(`for input "${testCase.name}"`, () => {

						beforeEach(() => {
							returnValue = instance.parse(testCase.input);
						});

						it('returns the expected tokens', () => {
							assert.strictEqual(JSON.stringify(returnValue), testCase.expectedResult);
						});

					});
				}

			});

		});

	});

	describe('.defaultOptions', () => {

		it('is an object', () => {
			assert.isNotNull(LinkParser.defaultOptions);
			assert.isTypeOf(LinkParser.defaultOptions, 'object');
		});

		describe('.closeCharacter', () => {

			it('is set to the expected string value', () => {
				assert.strictEqual(LinkParser.defaultOptions.closeCharacter, ']');
			});

		});

		describe('.commandCharacter', () => {

			it('is set to the expected string value', () => {
				assert.strictEqual(LinkParser.defaultOptions.commandCharacter, '>');
			});

		});

		describe('.defaultCommand', () => {

			it('is set to the expected string value', () => {
				assert.strictEqual(LinkParser.defaultOptions.defaultCommand, 'cmd');
			});

		});

		describe('.dividerCharacter', () => {

			it('is set to the expected string value', () => {
				assert.strictEqual(LinkParser.defaultOptions.dividerCharacter, '|');
			});

		});

		describe('.escapeCharacter', () => {

			it('is set to the expected string value', () => {
				assert.strictEqual(LinkParser.defaultOptions.escapeCharacter, '\\');
			});

		});

		describe('.openCharacter', () => {

			it('is set to the expected string value', () => {
				assert.strictEqual(LinkParser.defaultOptions.openCharacter, '[');
			});

		});

		describe('.log', () => {

			it('is the global `console` object', () => {
				assert.strictEqual(LinkParser.defaultOptions.log, console);
			});

		});

		describe('.linkLookup', () => {

			it('is a function which returns its first argument', () => {
				const linkLookup = LinkParser.defaultOptions.linkLookup;
				assert.isFunction(linkLookup);
				assert.strictEqual(linkLookup('mock'), 'mock');
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
			sinon.stub(Object, 'assign').returns(defaultedOptions);
			returnValue = LinkParser.applyDefaultOptions(userOptions);
		});

		it('defaults the `options`', () => {
			assert.calledOnce(Object.assign);
			assert.calledWith(Object.assign, {}, LinkParser.defaultOptions, userOptions);
		});

		it('returns the defaulted options with some transformations', () => {
			assert.strictEqual(returnValue, defaultedOptions);
		});

	});

});
