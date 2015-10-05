let jsDiff = require('diff');

let diff = {

    compare: function compare(one = '', two = '') {

        let self = this,
            d = jsDiff.diffChars(one, two),
            resultHtml = '';

        d.forEach(function(part) {
            if ((part.added !== undefined) && part.added) {
                resultHtml += '<span class="added">' + part.value + '</span>';
            } else {
                if ((part.removed !== undefined) && part.removed) {
                    resultHtml += '<span class="removed">' + part.value + '</span>';
                } else {
                    resultHtml += part.value;
                }
            }
        });

        return resultHtml;
    }

};

export default diff;
