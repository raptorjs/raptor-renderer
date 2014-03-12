'use strict';


function RenderResult(html, context) {
    this.html = html;
    this.context = context;
}

RenderResult.prototype = {
    toString: function() {
        return this.html;
    }
};
module.exports = RenderResult;