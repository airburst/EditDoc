import React from 'react';
import EditButtons from './edit-buttons';
import caret from '../utils/caret';

let Para = React.createClass({

    getInitialState: function() {
        return {text: this.props.text};
    },

    render: function() {
        return (
            <a className="editable">
                <EditButtons />
                <p 
                    id={this.props.id} 
                    onClick={this.clicked} 
                    onBlur={this.checkChanges}>
                    {this.state.text}
                </p>
            </a>
        );
    },

    clicked: function(event) {
        event.preventDefault();
        event.stopPropagation();
        //console.log(caret.getPosition(event.target));
    },

    checkChanges: function(event) {
        event.preventDefault();
        event.stopPropagation();

        let newText = event.target.innerText.trim();
        if (newText !== this.state.text) {
            // Create change object
            let change = {
                id:   event.target.id,
                oldValue: this.state.text,
                newValue: newText
            };

            // Set text state
            this.setState({text: newText});

            // Broadcast the change up to changes object
            this.props.changed(change);
        }
    }

});

export default Para;
