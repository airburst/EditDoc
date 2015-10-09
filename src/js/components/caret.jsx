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
            top: this.top()
        };
        console.log(selection);
        this.setState({selection: selection});
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
        let element = document.getElementById(this.props.id),
            rect = element.getBoundingClientRect();
        return rect.top - 106;
    }

});

export default Para;
