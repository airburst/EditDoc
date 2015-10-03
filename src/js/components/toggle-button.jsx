import React from 'react';
import EditButtons from './edit-buttons';

let ToggleButton = React.createClass({

    getInitialState: function() {
        return {active: this.props.active};
    },

    render: function() {
        return (
            <button 
                id="show-nav-button" 
                className={'btn btn-default btn-toggle' + (this.state.active ? ' active' : '')}
                onClick={this.handleClick}>
                <i className={'fa ' + this.props.icon}></i> {this.props.label}
            </button>
        );
    },

    handleClick: function(event) {
        console.log('calling update with ' + this.props.setting + '=' + this.state.active);
        this.setState({active: !this.state.active});
        this.props.update(this.props.setting, this.state.active);
    }

});

export default ToggleButton;
