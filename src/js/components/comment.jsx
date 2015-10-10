import React from 'react';

let Comment = React.createClass({

    render: function() {
        let commentCss = {
            top: this.props.top + 'px'
        };

        return (
            <div className="comment-container">
                <div className="comment-box" style={commentCss}>
                    <div className="comment-text">
                        <input type="text" />
                    </div>
                </div>
            </div>
        );
    }

});

export default Comment;
