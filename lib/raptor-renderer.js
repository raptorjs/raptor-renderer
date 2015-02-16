'use strict';
var asyncWriter = require('async-writer');
var RenderResult = require('./RenderResult');
var extend = require('raptor-util/extend');

 function createRenderFunc(renderer) {
    var renderFunc = renderer.renderer || renderer.render || renderer.process || renderer;

    return function render(input, out, callback) {
        // NOTE: we avoid using Function.apply for performance reasons
        switch (arguments.length) {
            case 0:
                // Arguments: input
                return exports.render(renderFunc);
            case 1:
                // Arguments: input
                return exports.render(renderFunc, input);
            case 2:
                // Arguments: input, out|callback
                return exports.render(renderFunc, input, out);
            case 3:
                // Arguments: input, out, callback
                return exports.render(renderFunc, input, out, callback);
            default:
                throw new Error('Illegal arguments');
        }
    };
}

exports.render = function (renderFunc, input, out) {
    var numArgs = arguments.length;
    var callback = arguments[numArgs - 1];
    var actualOut = out;
    var actualData = input || {};

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

    if (typeof renderFunc !== 'function') {
        renderFunc = renderFunc.render || renderFunc.process;

        if (typeof renderFunc !== 'function') {
            throw new Error('Invalid renderer');
        }
    }

    renderFunc(actualData, actualOut);

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

exports.renderable = function(target, renderer) {
    target.renderer = renderer;
    target.render = createRenderFunc(renderer);
};