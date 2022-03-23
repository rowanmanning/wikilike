
# @rowanmanning/wikilike

Parse and render wiki-like links.


## Table of Contents

  * [What's a wiki-like link?](#whats-a-wiki-like-link)
  * [Requirements](#requirements)
  * [Usage](#usage)
    * [Creating a parser](#creating-a-parser)
    * [Link lookups](#link-lookups)
    * [Examples](#examples)
  * [Contributing](#contributing)
  * [License](#license)


## What's a wiki-like link?

A wiki-like link uses a similar syntax to [links on Wikipedia](https://en.wikipedia.org/wiki/Help:Link), but with a few modifications for simplicity and ease-of-parsing.

The most basic form of link contains only a `location`. We surround the link location with double opening and closing square brackes (`[[`, `]]`). If we wanted to link to a page named "example", we'd use the following:

```
This is some content with a link: [[ example ]]
```

_Note: it's up to you how you turn the provided location into a reference to a page – we don't make decisions for you. See [link lookups](#link-lookups) for how to do this._

When you want to control the display of a link, we use a `label`. This allows us to create a link that has text different to its location. The label is added after the location, separated by a pipe character (`|`):

```
This is some content with [[ example | a link ]]
```

Links can also be preceeded with a command, which instructs your lookup to do something different with the link. This is specified using a right angle bracked (`>`):

```
This link will have its content manipulated by a command:
[[do-something> example ]]
```

_Note: it's up to your lookup function to execute commands. See [link lookups](#link-lookups) for how to do this._


## Requirements

This library requires the following to run:

  * [Node.js](https://nodejs.org/) 14+


## Usage

Install with [npm](https://www.npmjs.com/):

```sh
npm install @rowanmanning/wikilike
```

Load the library into your code with a `require` call:

```js
const LinkParser = require('@rowanmanning/wikilike');
```

### Creating a parser

```js
const parser = new LinkParser(options);
```

The available options are:

  - `closeCharacter`: The character used to close a link. String. Defaults to `]`
  - `commandCharacter`: The character used to indicate that the preceeding characters are a command name. String. Defaults to `>`
  - `defaultCommand`: The default command. Used when the command character is present but no String. Defaults to `cmd`
  - `dividerCharacter`: The character used as a divider between the link location and label. String. Defaults to `|`
  - `escapeCharacter`: The character used to escape meaningful characters inside the String. Defaults to `\`
  - `log`: A console object which implements `info` and `error` methods. Object. Defaults to `console`
  - `linkLookup`: A function that is called before a link is rendered. Function. Defaults to `link => link`. See [link lookups](#link-lookups)
  - `openCharacter`: The character used to open a link. String. Defaults to `[`

### Converting links to HTML

To parse links and render the to HTML `a` elements, use:

```js
const input = 'This is a link: [[ example ]]';
const output = await parser.toHTML(input);
```

### Link lookups

Link parsing is only really useful when you specify your own link lookup function – the default function will set the output link `href` attribute to exactly the location that's provided.

A link lookup function is called for every link found, and it receives the following object which represents the link:

```js
// With input link: [[cmd> hello | world ]]
{
	// The link location
	location: 'hello',

	// The provided label (or `null` if no label is provided)
	label: 'world',

	// The provided command (or `undefined` if no command is provided)
	command: 'cmd',

	// The raw input which was parsed into the link
	raw: '[[cmd> hello | world ]]',

	// A property which can used to override the link output
	override: undefined
}
```

The lookup function _may_ be asynchronous. It _must_ return either a link object which has the above properties, or a promise that resolves with a link object.

If the link object has any additional properties, they will be used to set attributes on the resulting `a` element. The `className` property should be used in place of `class`.

If the lookup function throws an error, the link's raw text will be output with no further parsing. If the returned link has an `override` property which is set to a string, the link will be output as _exactly_ that string with no further parsing.

See the [examples](#examples) for implementations.

### Examples

We provide a few example implementations which demonstrate different features:

  - **[Basic](example/basic)**: the simplest use of the library to render links to HTML. Run `node example/basic` to ouput a rendered input to the command line.

  - **[Lookup](example/lookup)**: an example of a lookup function, used to find link information from static fules. Run `node example/lookup` to output a rendered input to the command line.

  - **[Commands](example/commands)**: extending the Lookup example to support an `embed` command, which embeds the content of the linked page. Run `node example/commands` to output a rendered input to the command line.


## Contributing

[The contributing guide is available here](docs/contributing.md). All contributors must follow [this library's code of conduct](docs/code_of_conduct.md).


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2019, Rowan Manning
