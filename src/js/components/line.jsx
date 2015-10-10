import React from 'react';

let Line = React.createClass({

    lineCss: function() {
        let length = this.props.endX - this.props.startX,
            transform = 'rotate(0deg)';

        return {
            position: 'absolute',
            transform: transform,
            width: length,
            left: this.props.startX,
            top: this.props.top
        }
    },

    render: function() {
        return (
            <div className="line" style={this.lineCss()}></div>
        );
    }

});

export default Line;
