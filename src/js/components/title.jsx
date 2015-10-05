import React from 'react';

class Title extends React.Component {
    render() {
        return (
            <h2 id={this.props.id} key={this.props.id}>{this.props.text}</h2>
        );
    }
}

export default Title;
