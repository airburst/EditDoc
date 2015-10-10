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
    },

    lineNumber: function(paragraphId, lineNum) {
        lineNum--;
        let elem = document.getElementById(paragraphId),
            spanChildren = elem.getElementsByTagName('span'),
            paragraphText = elem.innerHTML.replace(/(\r\n|\n|\r)/gm, ''),
            newParagraphText = '',
            words = [],
            max;

        if (spanChildren.length === 0) {
            words = paragraphText.split(' ');
            for (var i = 0; max = words.length, i < max; i++) {
                newParagraphText += '<span>' + words[i] + '</span> ';
            }
            elem.innerHTML = newParagraphText;
        } else {
            max = spanChildren.length;
            for (var i = 0; max, i < max; i++) {
                words[words.length] = spanChildren[i].innerHTML;
            }
        }

        let lineCounter = 0,
            previousY = spanChildren[0].offsetTop,
            returnText = '',
            startReturning = false;

        max = words.length;
        for (var i = 0; max, i < max; i++) {
            if (spanChildren[i].offsetTop != previousY) { lineCounter++; }
            if (lineCounter === lineNum) { startReturning = true; }
            if (lineCounter !== lineNum && startReturning) { return returnText.substring(0, returnText.length - 1); }
            if (startReturning) {
                returnText += words[i] + ' ';
                if (i + 1 === words.length) { return returnText.substring(0, returnText.length - 1); }
            }
            previousY = spanChildren[i].offsetTop;
        }
        return null;
    },

    getLine: function(paragraphId, caretPosition) {
        let elem = document.getElementById(paragraphId),
            spanChildren = elem.getElementsByTagName('span'),
            original = elem.innerHTML,
            paragraphText = elem.innerHTML.replace(/(\r\n|\n|\r)/gm, ''),
            newParagraphText = '',
            words = [],
            max,
            i;

        // Parse paragraph into an array of words
        if (spanChildren.length === 0) {
            words = paragraphText.split(' ');
            for (i = 0; max = words.length, i < max; i++) {
                newParagraphText += '<span>' + words[i] + '</span> ';
            }
            elem.innerHTML = newParagraphText;
        } else {
            max = spanChildren.length;
            for (i = 0; max, i < max; i++) {
                words.push(spanChildren[i].innerHTML);
            }
        }

        let lineCounter = 0,
            charCounter = 0,
            previousY = spanChildren[0].offsetTop;

        // Find line on which our caret position falls
        max = words.length;
        i = 0;
        while (charCounter < caretPosition) {
            // Add characters in current word, plus a space
            charCounter += words[i].length + 1;

            // Test whether word is on a new line in paragraph
            if (spanChildren[i].offsetTop != previousY) {
                lineCounter++;
                previousY = spanChildren[i].offsetTop;
            }
            i++;
        }

        // Put paragraph html back the way it was
        elem.innerHTML = original;
        return lineCounter;
    }

};

export default caret;
