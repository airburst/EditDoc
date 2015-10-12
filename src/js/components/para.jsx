import React from 'react';
import EditButtons from './edit-buttons';
import selection from '../utils/selections';
import diff from '../utils/diff';

let Para = React.createClass({

    /*getInitialState: function() {
        return {
            text: this.props.text
        };
    },*/

    render: function() {
        return (
            <a className="editable">
                <p 
                    id={this.props.id} 
                    onBlur={this.checkChanges}
                    onMouseUp={this.onMouseUp}
                    dangerouslySetInnerHTML={{__html: this.props.text}}>
                </p>
            </a>
        );
    },

    onMouseUp: function(event) {
        var text = "",
            selected;

        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }

        selected = {
            id:         event.target.id,
            text:       text,
            position:   selection.getPosition(event.target),
            base:       this.base()
        };       
        this.props.selected(selected);
    },

    checkChanges: function(event) {
        event.preventDefault();
        event.stopPropagation();

        let newText = event.target.innerText.trim();    //TODO: compare html, not text
        if (newText !== this.props.text) {
            // Create change object
            let change = {
                id:   event.target.id,
                oldValue: this.props.text,
                newValue: newText
            };

            // Diff
            console.log(diff.compare(this.props.text, newText));

            // Set text state
            this.setState({text: newText});

            // Broadcast the change up to changes object
            this.props.changed(change);
        }
    },

    base: function() {
        let item = document.getElementById(this.props.id).getBoundingClientRect(),
            docScrolled  = document.getElementById('doc').scrollTop;
        return item.bottom + docScrolled - 53;
    }

});

export default Para;
