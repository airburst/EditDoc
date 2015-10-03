import React from 'react';
import EditButtons from './edit-buttons';
import Uuid from '../utils/uuid';

class ToggleButton extends React.Component {

    handleClick() {
        
    }

    render() {
        return (
            <button 
                id="show-nav-button" 
                className={this.props.show ? 'btn btn-default btn-toggle active' : 'btn btn-default btn-toggle'}
                onclick="console.log('Toggle navigation');">
                <i className="fa fa-bars"></i> Navigation
            </button>
        );
    }
}

export default ToggleButton;
