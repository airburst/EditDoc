let caret = {

    _getCaretPosition: function getCaretPosition(range, node) {

        var treeWalker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            function(node) {
                var nodeRange = document.createRange();
                nodeRange.selectNode(node);
                return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ?
                    NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            },
            false
        );

        var charCount = 0;
        while (treeWalker.nextNode()) {
            charCount += treeWalker.currentNode.length;
        }
        if (range.startContainer.nodeType == 3) {
            charCount += range.startOffset;
        }
        return charCount;
    },

    getPosition: function(el) {
        let range = window.getSelection().getRangeAt(0);
        return this._getCaretPosition(range, el);
    }

};

/*document.body.addEventListener("mouseup", function() {
    var el = document.getElementById("test");
    var range = window.getSelection().getRangeAt(0);
    console.log("Caret char pos: " + getCaretPosition(range, el))
}, false);*/

export default caret;
