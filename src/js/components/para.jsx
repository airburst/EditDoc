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
                <p id={this.props.id} onClick={this.clicked}>{this.state.text}</p>
            </a>
        );
    },

    clicked: function(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log(caret.getPosition(event.target));
    }

});

export default Para;
