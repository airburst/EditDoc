import React from 'react';
import EditButtons from './edit-buttons';

let ToggleButton = React.createClass({

    getInitialState: function() {
        return {active: this.props.active};
    },

    render: function() {
        return (
            <button
                className={'btn btn-default btn-toggle' + (this.state.active ? ' active' : '')}
                onClick={this.handleClick}>
                <i className={'fa ' + this.props.icon}></i> {this.props.label}
            </button>
        );
    },

    handleClick: function(event) {
        let newState = !this.state.active;
        this.setState({active: newState});
        this.props.update(this.props.setting, newState);
    }

});

export default ToggleButton;
