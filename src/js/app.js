import React from 'react';
import Header from './components/header';
import NavPane from './components/nav-pane';
import Doc from './components/doc';
import CommentPane from './components/comment-pane';
import Editor from './components/medium-editor';
import Data from './data/doc-data';
import AppSettings from './data/app-settings';

let DocContainer = React.createClass({

    getInitialState: function() {
        return {
            settings: AppSettings,
            changes: []
        };
    },

    render: function() {
        return (
            <div className="content">
                <div className="row">
                    <Header settings={this.state.settings} update={this.updateAppSetting}/>
                </div>
                <div className="flexbox-container">
                    <NavPane doc={this.props.data} show={this.state.settings.showNav} />
                    <Doc doc={this.props.data} changed={this.addChange} />
                    <CommentPane show={this.state.settings.showComments} />
                </div>
            </div>
        );
    },

    updateAppSetting: function(key, value) {
        AppSettings[key] = value;
        this.setState({settings: AppSettings});
    },

    addChange: function(change) {
        self.setState({changes: self.state.changes.concat([change])});
        console.log(self.state.changes.length);
    },

    componentDidMount: function() {
        let editor = Editor()
            self = this;

        // Apply Scrollspy to side nav
        $('.doc').scrollspy({
            target: '.bs-docs-sidebar',
            offset: 40
        });
    }

});

React.render(<DocContainer data={Data} settings={AppSettings} />, document.body);
