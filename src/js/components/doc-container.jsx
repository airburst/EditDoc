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
                    <Header settings={this.props.settings}/>
                </div>
                <div className="flexbox-container">
                    <NavPane doc={this.props.data} show={this.props.settings.showNav} />
                    <Doc doc={this.props.data} />
                    <CommentPane show={this.props.settings.showComments} />
                </div>
            </div>
        );
    }

    componentDidMount() {
        StartMediumEditor();
    }
}

export default DocContainer;
