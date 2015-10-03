import React from 'react';
import EditButtons from './edit-buttons';
import Uuid from '../utils/uuid';

class Para extends React.Component {
    render() {
        return (
            <a className="editable">
                <EditButtons />
                <p id={this.props.id} key={this.props.id}>{this.props.text}</p>
            </a>
        );
    }
}

export default Para;
