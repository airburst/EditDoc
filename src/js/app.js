import React from 'react';
import Immutable from 'immutable';
import Header from './components/header';
import NavPane from './components/nav-pane';
import Doc from './components/doc';
import CommentPane from './components/comment-pane';
import Editor from './components/medium-editor';
import {data, lines} from './data/doc-data';
import AppSettings from './data/app-settings';

let settings = Immutable.Map(AppSettings);
//let appState = Immutable.Map();

let DocContainer = React.createClass({

    getInitialState: function() {
        return {
            settings: AppSettings,
            changes: [],
            comments: []
        };
    },

    render: function() {
        return (
            <div className="content">
                <div className="row">
                    <Header
                        settings={this.state.settings}
                        update={this.updateAppSetting}
                        addComment={this.addComment}/>
                </div>
                <div className="flexbox-container">
                    <NavPane
                        doc={this.props.data}
                        show={this.state.settings.showNav} />
                    <Doc
                        doc={this.props.data}
                        lines={this.props.lines}
                        changed={this.addChange}
                        showComments={this.state.settings.showComments} />
                </div>
            </div>
        );
    },

    updateAppSetting: function(key, value) {
        AppSettings[key] = value;
        this.setState({settings: AppSettings});
    },

    addComment: function() {
        console.log('Add new comment...');

        // Wrap highlighted text with span.comment-hl
        // Does this work with a single caret position?
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

React.render(<DocContainer data={data} lines={lines} settings={AppSettings} />, document.body);
