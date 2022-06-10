/**
 * @module @rowanmanning/wikilike
 */
'use strict';

const {createElement, renderToString} = require('hyperons');

/**
 * Represents a wikilike link parser.
 */
class LinkParser {

	/**
	 * Class constructor.
	 *
	 * @access public
	 * @param {object} [options={}]
	 *     An options object used to configure the parser.
	 * @param {string} [options.closeCharacter]
	 *     The character used to close a link.
	 * @param {string} [options.commandCharacter='>']
	 *     The character used to indicate that the preceeding characters are a command name.
	 * @param {string} [options.defaultCommand='cmd']
	 *     The default command. Used when the command character is present but no
	 *     command is specified.
	 * @param {string} [options.dividerCharacter='|']
	 *     The character used as a divider between the link location and label.
	 * @param {string} [options.escapeCharacter='\']
	 *     The character used to escape meaningful characters inside the
	 *     command, link, and location.
	 * @param {object} [options.log=console]
	 *     A console object which implements `info` and `error` methods.
	 * @param {linkLookupFunction} [options.linkLookup]
	 *     A function that is called before a link is rendered.
	 * @param {string} [options.openCharacter]
	 *     The character used to open a link.
	 */
	constructor(options) {
		this.options = this.constructor.applyDefaultOptions(options);
		this.log = this.options.log;
	}

	/**
	 * Parse input, returning an array of tokens found.
	 *
	 * @access public
	 * @param {string} input
	 *     Input containing links to parse into tokens.
	 * @returns {Array<(TextToken|LinkToken)>}
	 *     Returns an array of tokens.
	 */
	parse(input) {
		const CLOSE = this.options.closeCharacter;
		const COMMAND = this.options.commandCharacter;
		const DIVIDER = this.options.dividerCharacter;
		const ESCAPE = this.options.escapeCharacter;
		const OPEN = this.options.openCharacter;

		const tokens = [
			{
				type: 'text',
				raw: ''
			}
		];
		let current;
		let inEscapeSequence = false;
		for (const char of [...input]) {
			current = tokens[tokens.length - 1];

			// If we're currently in text...
			if (current.type === 'text') {

				// The only rule to consider inside text is whether
				// we've found a potential opener for a link
				if (char === OPEN) {
					tokens.push({
						type: 'link',
						state: 'opening',
						location: '',
						label: '',
						raw: char
					});

				// Otherwise we just append to the text
				} else {
					current.raw += char;
				}

			// If we're currently in a link (the only other type)...
			} else {

				// ...and we encounter an opener...
				if (char === OPEN && !inEscapeSequence) {

					// Get the previous character, we need it for detecting
					// over-qualified openers
					const previousCharacter = current.raw[current.raw.length - 1];

					// If the link is currently opening, it's now open
					if (current.state === 'opening') {
						current.state = 'location';
						current.raw += char;

					// If we're in the location state, and we encounter
					// another opener immediately after the other openers
					// we use it
					} else if (current.state === 'location' && previousCharacter === OPEN) {
						const previous = tokens[tokens.length - 2];
						previous.raw += char;

					// Otherwise there's a syntax error and we need
					// to convert our link token to text
					} else {
						const old = tokens.pop();
						current = tokens[tokens.length - 1];
						current.raw += old.raw + char;
					}

				// ...and we encounter a closer...
				} else if (char === CLOSE && !inEscapeSequence) {

					// If the link is already open, we can now start
					// closing it
					if (current.state === 'location' || current.state === 'label') {
						current.state = 'closing';
						current.raw += char;

					// If the link is already closing, we can tidy up and hopefully close
					} else if (current.state === 'closing') {

						// Tidy up
						current.location = current.location.trim() || null;
						current.label = current.label.trim() || null;
						if (typeof current.command === 'string') {
							current.command = current.command.trim() || this.options.defaultCommand;
						}

						if (current.location === null) {
							const old = tokens.pop();
							current = tokens[tokens.length - 1];
							current.raw += old.raw + char;
						} else {
							delete current.state;
							current.raw += char;
							tokens.push({
								type: 'text',
								raw: ''
							});
						}

					// Otherwise there's a syntax error and we need
					// to convert our link token to text
					} else {
						const old = tokens.pop();
						current = tokens[tokens.length - 1];
						current.raw += old.raw + char;
					}

				// ...and we encounter a divider...
				} else if (char === DIVIDER && !inEscapeSequence) {

					// If the link location is set, we can switch to the label
					if (current.state === 'location') {
						current.state = 'label';
						current.raw += char;

					// Otherwise there's a syntax error and we need
					// to convert our link token to text
					} else {
						const old = tokens.pop();
						current = tokens[tokens.length - 1];
						current.raw += old.raw + char;
					}

				// ...and we encounter a command character...
				} else if (
					char === COMMAND &&
					!inEscapeSequence &&
					current.state === 'location' &&
					current.command === undefined
				) {

					// We have a command character, which means everything before it
					// must be removed from the location
					current.command = current.location;
					current.location = '';
					current.raw += char;

				// ...and we encounter an escape...
				} else if (char === ESCAPE && !inEscapeSequence) {

					// If the link is open, that's fine
					if (current.state === 'location' || current.state === 'label') {
						current.raw += char;
						inEscapeSequence = true;

					// Otherwise there's a syntax error and we need
					// to convert our link token to text
					} else {
						const old = tokens.pop();
						current = tokens[tokens.length - 1];
						current.raw += old.raw + char;
					}

				// ...and we encounter a line break character (ignoring escape sequences)...
				} else if (char === '\n' || char === '\r') {
					const old = tokens.pop();
					current = tokens[tokens.length - 1];
					current.raw += old.raw + char;

				// ...and we encounter a normal character...
				} else {

					// If the link is open, that's fine
					if (current.state === 'location' || current.state === 'label') {
						current.raw += char;
						current[current.state] += char;
						inEscapeSequence = false;

					// Otherwise there's a syntax error and we need
					// to convert our link token to text
					} else {
						const old = tokens.pop();
						current = tokens[tokens.length - 1];
						current.raw += old.raw + char;
					}

				}
			}
		}
		return tokens;
	}

	/**
	 * Parse input and render it using a link transforming function.
	 *
	 * @access public
	 * @param {string} input
	 *     Input containing links to parse and render.
	 * @param {linkTransformFunction} linkTransform
	 *     A function used to transform each link.
	 * @param {object} [lookupContext={}]
	 *     Additional context to pass into the link lookup when it is called.
	 * @returns {Promise<string>}
	 *     Resolves with the parsed and transformed input.
	 */
	async render(input, linkTransform, lookupContext = {}) {
		let output = '';
		for (const token of this.parse(input)) {
			if (token.type === 'link') {
				try {
					const link = await this.options.linkLookup(token, lookupContext);
					output += link.override || linkTransform(link);
				} catch (error) {
					this.log.error(`Error processing link "${token.raw}":`, error);
					output += token.raw;
				}
			} else {
				output += token.raw;
			}
		}
		return output;
	}

	/**
	 * Parse input and render found wikilinks as HTML.
	 *
	 * @access public
	 * @param {string} input
	 *     Input containing links to parse and render.
	 * @param {object} [lookupContext]
	 *     Additional context to pass into the link lookup when it is called.
	 * @returns {Promise<string>}
	 *     Resolves with the parsed and transformed input.
	 */
	toHTML(input, lookupContext) {
		return this.render(input, link => {
			const {label, location} = link;

			// Prep link element attributes
			const attributes = Object.assign({href: location}, link);
			delete attributes.command;
			delete attributes.label;
			delete attributes.location;
			delete attributes.raw;
			delete attributes.type;

			return renderToString(createElement('a', attributes, label || location));
		}, lookupContext);
	}

	/**
	 * Apply default values to a set of user-provided options.
	 * Used internally by {@link LinkParser#constructor}.
	 *
	 * @access private
	 * @param {object} [userOptions={}]
	 *     Options to add on top of the defaults. See {@link LinkParser#constructor}.
	 * @returns {object}
	 *     Returns the defaulted options.
	 */
	static applyDefaultOptions(userOptions) {
		return Object.assign({}, this.defaultOptions, userOptions);
	}

}

/**
 * Default options to be used in construction of a link parser.
 *
 * @access private
 * @type {object}
 */
LinkParser.defaultOptions = {
	closeCharacter: ']',
	commandCharacter: '>',
	defaultCommand: 'cmd',
	dividerCharacter: '|',
	escapeCharacter: '\\',
	log: console,
	linkLookup: link => link,
	openCharacter: '['
};

module.exports = LinkParser;

/**
 * A link lookup callback function.
 *
 * @callback linkLookupFunction
 * @param {LinkToken} link
 *     An object which represents a found link. Use the properties on this object
 *     to find the page or content that the link represents.
 * @param {object} [context={}]
 *     Additional context to be passed into the lookup. This context is defined when
 *     a call to `render` or `toHTML` is made.
 * @returns {Promise<object>}
 *     Returns a promise that resolves with a modified link object.
 * @throws {Error}
 *     Throws if the lookup errors for a link.
 */

/**
 * A link transform callback function.
 *
 * @callback linkTransformFunction
 * @param {LinkToken} link
 *     An object which represents a found link. Use the properties on this object
 *     to build the transformed output.
 * @returns {string}
 *     Returns a string representation of the link.
 */

/**
 * An object representing a link found during parsing.
 *
 * @typedef {object} LinkToken
 * @property {(string | undefined)} command
 *     The name of a command to run while rendering the link (if one was specified).
 *     It's up to the lookup function what is done with valid and invalid commands.
 * @property {(string | null)} label
 *     The link label, if one is specified. A `null` label indicates that no label was given.
 * @property {string} location
 *     The link location.
 * @property {string} raw
 *     The raw text input which resulted in the parsed link.
 * @property {(string | undefined)} override
 *     Set to a string to override the default link rendering.
 */

/**
 * An object representing text found during parsing.
 *
 * @typedef {object} TextToken
 * @property {string} raw
 *     The raw text input.
 */
