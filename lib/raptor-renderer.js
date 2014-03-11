'use strict';
var renderContext = require('raptor-render-context');
var RenderResult = require('./RenderResult');

module.exports = {
    render: function (renderer, data, callback, context) {
        if (typeof callback !== 'function') {
            // A context object was provided instead of a callback
            context = callback;
            callback = null;
        }

        var renderFunc = renderer.render || renderer.process || renderer;
        if (typeof renderFunc !== 'function') {
            throw new Error('Invalid renderer');
        }

        if (!context) {
            context = renderContext.createContext();    
        }
        
        var html = renderFunc.call(renderer, data || {}, context);

        if (callback) {
            context
                .on('end', function() {
                    callback(null, new RenderResult(html == null ? context.getOutput() : html, context));
                })
                .on('error', callback);
        }
        else {
            return new RenderResult(html == null ? context.getOutput() : html, context);
        }
    },
    renderTemplate: function (templatePath, templateData, context) {
        return this.render(function (input, _context) {
            require('raptor-' + 'templates').render(templatePath, templateData, _context);
        }, {}, context);
    }
};