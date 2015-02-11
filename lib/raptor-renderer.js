'use strict';
var asyncWriter = require('async-writer');
var RenderResult = require('./RenderResult');
var extend = require('raptor-util/extend');

exports.createRenderFunc = function(renderer) {
    return function render(data, out, callback) {
        // NOTE: we avoid using Function.apply for performance reasons
        switch (arguments.length) {
            case 1:
                // Arguments: data
                return exports.render(renderer, data);
            case 2:
                // Arguments: data, out|callback
                return exports.render(renderer, data, out);
            case 3:
                // Arguments: data, out, callback
                return exports.render(renderer, data, out, callback);
            default:
                throw new Error('Illegal arguments');
        }
    };
};

exports.render = function (renderer, data, out) {
    var numArgs = arguments.length;
    var callback = arguments[numArgs - 1];
    var actualOut = out;
    var actualData = data || {};

    if (typeof callback === 'function') {
        // found a callback
        if (numArgs === 3) {
            actualOut = asyncWriter.create();
        }
    } else {
        callback = null;
        if (!actualOut) {
            actualOut = asyncWriter.create();
        }
    }

    var $global = actualData.$global;
    if ($global) {
        extend(actualOut.global, $global);
    }

    var renderFunc = renderer.render || renderer.process || renderer;
    if (typeof renderFunc !== 'function') {
        throw new Error('Invalid renderer');
    }

    renderFunc.call(renderer, actualData || {}, actualOut);

    if (callback) {
        actualOut
            .on('finish', function() {
                callback(null, new RenderResult(actualOut.getOutput(), actualOut));
            })
            .on('error', callback);
        actualOut.end();
    } else {
        // NOTE: If no callback is provided then it is assumed that no asynchronous rendering occurred.
        //       Might want to add some checks in the future to ensure the actualOut is really done
        actualOut.end();
        return new RenderResult(actualOut.getOutput(), actualOut);
    }
};