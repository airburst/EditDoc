let MediumEditor = require('medium-editor');

let Editor = function() {
    let elements = document.querySelectorAll('.editable p'),

        editorOptions = {
            buttonLabels: 'fontawesome',
            placeholder: {
                text: '[Removed]'
            },
            toolbar: {
                allowMultiParagraphSelection: true,
                buttons: [
                    'bold',
                    'italic',
                    'underline',
                    'strikethrough','anchor',
                    'orderedlist',
                    'unorderedlist',
                    'indent',
                    'outdent'
                ],
                diffLeft: 0,
                diffTop: -10,
                firstButtonClass: 'medium-editor-button-first',
                lastButtonClass: 'medium-editor-button-last',
                standardizeSelectionStart: false,
                static: false,
                relativeContainer: null,
                align: 'center',
                sticky: false,
                updateOnEmptySelection: false
            }
        },

        editor = new MediumEditor(elements, editorOptions);

    return editor;

}

export default Editor;
