'use strict';

const Hyperons = {};

Hyperons.createElement = jest.fn().mockReturnValue('mock element');
Hyperons.renderToString = jest.fn().mockReturnValue('mock rendered template');

module.exports = Hyperons;
