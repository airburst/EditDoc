import React from 'react';
import Header from './components/header';
import NavPane from './components/nav-pane';
import Doc from './components/doc';
import CommentPane from './components/comment-pane';
import StartMediumEditor from './components/medium-editor';
import Data from './data/doc-data';
import AppSettings from './data/app-settings';

let DocContainer = React.createClass({

    getInitialState: function() {
        return {settings: AppSettings};
    },

    render: function() {
        return (
            <div className="content">
                <div className="row">
                    <Header settings={this.state.settings} update={this.updateAppSetting}/>
                </div>
                <div className="flexbox-container">
                    <NavPane doc={this.props.data} show={this.state.settings.showNav} />
                    <Doc doc={this.props.data} />
                    <CommentPane show={this.state.settings.showComments} />
                </div>
            </div>
        );
    },

    updateAppSetting: function(key, value) {
        AppSettings[key] = value;
        this.setState({settings: AppSettings});
    },

    componentDidMount: function() {
        StartMediumEditor();
    }

});

React.render(<DocContainer data={Data} settings={AppSettings}/>, document.body);
