'use strict';
var asyncWriter = require('async-writer');
var RenderResult = require('./RenderResult');
var extend = require('raptor-util/extend');
module.exports = {
    render: function (renderer, data, out) {

        var numArgs = arguments.length;
        var callback = arguments[numArgs - 1];
        if (typeof callback === 'function') {
            // found a callback
            if (numArgs === 3) {
                out = asyncWriter.create();
            }
        } else {
            callback = null;
            if (!out) {
                out = asyncWriter.create();
            }
        }

        var $global = data.$global;
        if ($global) {
            extend(out.global, $global);
        }

        var renderFunc = renderer.render || renderer.process || renderer;
        if (typeof renderFunc !== 'function') {
            throw new Error('Invalid renderer');
        }

        renderFunc.call(renderer, data || {}, out);

        if (callback) {
            out
                .on('finish', function() {
                    callback(null, new RenderResult(out.getOutput(), out));
                })
                .on('error', callback);
            out.end();
        } else {
            // NOTE: If no callback is provided then it is assumed that no asynchronous rendering occurred.
            //       Might want to add some checks in the future to ensure the out is really done
            out.end();
            return new RenderResult(out.getOutput(), out);
        }
    },
    renderTemplate: function (templatePath, templateData, callback) {
        return this.render(
            function (input, out) {
                require('raptor-' + 'templates').render(templatePath, input, out);
            },
            templateData,
            callback);
    }
};
