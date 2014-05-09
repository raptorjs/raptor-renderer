'use strict';
var renderContext = require('raptor-render-context');
var RenderResult = require('./RenderResult');

module.exports = {
    render: function (renderer, data, callback) {

        var context = renderContext.create();


        if (typeof callback === 'function') {
            // A context object was provided instead of a callback
            context = renderContext.create();
        } else if (callback) {
            throw new Error('Callback should be a function');
        }

        var renderFunc = renderer.render || renderer.process || renderer;
        if (typeof renderFunc !== 'function') {
            throw new Error('Invalid renderer');
        }
        
        var html = renderFunc.call(renderer, data || {}, context);

        if (callback) {
            context
                .on('end', function() {
                    callback(null, new RenderResult(html == null ? context.getOutput() : html, context));
                })
                .on('error', callback);
            context.end();
        } else {
            // NOTE: If no callback is provided then it is assumed that no asynchronous rendering occurred.
            //       Might want to add some checks in the future to ensure the context is really done
            context.end();
            return new RenderResult(html == null ? context.getOutput() : html, context);
        }
    },
    renderTemplate: function (templatePath, templateData, callback) {
        return this.render(
            function (input, context) {
                require('raptor-' + 'templates').render(templatePath, input, context);
            },
            templateData,
            callback);
    }
};