import React from 'react';
import EditButtons from './edit-buttons';
import GetCaretPosition from '../utils/get-caret-position';

let Para = React.createClass({

    getInitialState: function() {
        return {text: this.props.text};
    },

    render: function() {
        return (
            <a className="editable">
                <EditButtons />
                <p id={this.props.id}>{this.state.text}</p>
            </a>
        );
    }

});

export default Para;
