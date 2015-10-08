import React from 'react';

let Comment = React.createClass({

    render: function() {
        return (
            <div className="comment-container">
                <div className="comment-box">
                    <div className="comment-text" contentEditable="true">
                        {this.props.commentText}
                    </div>
                </div>
            </div>
        );
    }

});

export default Comment;
