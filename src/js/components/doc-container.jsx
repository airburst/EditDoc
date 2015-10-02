import React from 'react';
import NavPane from './navpane';
import Doc from './doc';

class DocContainer extends React.Component {

    render() {
        return (
            <div className="flexbox-container">
                <NavPane doc={this.props.data} />
                <Doc doc={this.props.data} />
            </div>
        );
    }

    componentDidMount() {
        // Apply Scrollspy to side nav
        $('.doc-pane .panel-content').scrollspy({
            target: '.bs-docs-sidebar',
            offset: 40
        });

        // Apply Medium Editor to all content in doc pane
        var MediumEditor = require('medium-editor'),
            elements = document.querySelectorAll('.editable p'),
            editorOptions = {
                buttonLabels: 'fontawesome',
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
    }
}

export default DocContainer;
