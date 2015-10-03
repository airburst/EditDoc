import React from 'react';
import Header from './header';
import NavPane from './nav-pane';
import CommentPane from './comment-pane';
import Doc from './doc';
import StartMediumEditor from './medium-editor';

class DocContainer extends React.Component {

    render() {
        return (
            <div className="content">
                <div className="row">
                    <Header />
                </div>
                <div className="flexbox-container">
                    <NavPane doc={this.props.data} />
                    <Doc doc={this.props.data} />
                    <CommentPane />
                </div>
            </div>
        );
    }

    componentDidMount() {
        StartMediumEditor();
    }
}

export default DocContainer;
