'use strict';

var fs = require('fs'),
    util = require('util');

var _ = require('lodash'),
    jsonLint = require('json-lint'),
    stripJsonComments = require('strip-json-comments');

require.extensions['.json'] = function (module, filename){
    var content = fs.readFileSync(filename, 'utf8');
    content = stripJsonComments(content);
    var lint = jsonLint(content);
    if(lint.error){
        var errorText = util.format('%s (%s:%s:%s)', lint.error, filename, lint.line, lint.character);
        throw new SyntaxError(errorText, filename, lint.line);
    }
    module.exports = JSON.parse(content);
};;
