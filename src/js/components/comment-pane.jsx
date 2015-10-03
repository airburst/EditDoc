import React from 'react';

class CommentPane extends React.Component {

    render() {
        return (
            <div className={this.props.show ? 'sidepanel right' : 'sidepanel right flex-hide'}>
                <div className="panel-content">
                    <h2 className="panel-title-right">Comments</h2>
                    
                </div>
            </div>
        );
    }
}

export default CommentPane;
