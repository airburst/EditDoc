import React from 'react';

let Comment = React.createClass({

    render: function() {
        return (
            <div className="comment-container">
                <div className="comment-box">
                    <div className="comment-text">
                        <input type="text" />
                    </div>
                </div>
            </div>
        );
    }

});

export default Comment;
