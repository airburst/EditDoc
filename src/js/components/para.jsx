import React from 'react';
import EditButtons from './edit-buttons';
import caret from '../utils/selections';
import diff from '../utils/diff';

let Para = React.createClass({

    getInitialState: function() {
        return {
            text: this.props.text,
            selection: {}
        };
    },

    render: function() {
        return (
            <a className="editable">
                <EditButtons />
                <p 
                    id={this.props.id} 
                    onBlur={this.checkChanges}
                    onMouseUp={this.onMouseUp}>
                    {this.state.text}
                </p>
            </a>
        );
    },

    onMouseUp: function(event) {
        var text = "",
            selection;

        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        selection = {
            text: text,
            caret: caret.getPosition(event.target),
            height: event.pageY + document.getElementById('doc').scrollTop - 100
        };
        console.log(selection);
        this.setState({selection: selection});
        /*<svg>
            <line x1="0" y1="200" x2="-300" y2="200" style="stroke:red;stroke-width:1"></line>
        </svg>*/
    },

    checkChanges: function(event) {
        event.preventDefault();
        event.stopPropagation();

        let newText = event.target.innerText.trim();    //TODO: compare html, not text
        if (newText !== this.state.text) {
            // Create change object
            let change = {
                id:   event.target.id,
                oldValue: this.state.text,
                newValue: newText
            };

            // Diff
            console.log(diff.compare(this.state.text, newText));

            // Set text state
            this.setState({text: newText});

            // Broadcast the change up to changes object
            this.props.changed(change);
        }
    },

    top: function() {
        let item = document.getElementById(this.props.id).getBoundingClientRect(),
            docScrolled  = document.getElementById('doc').scrollTop;
        return item.top + docScrolled - 106;
    }

});

export default Para;
