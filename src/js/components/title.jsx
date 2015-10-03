import React from 'react';
import Uuid from '../utils/uuid';

class Title extends React.Component {
    render() {
        return (
            <h2 id={this.props.id} key={this.props.id}>{this.props.text}</h2>
        );
    }
}

export default Title;
