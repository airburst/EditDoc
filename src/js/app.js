import React from 'react';
import Immutable from 'immutable';
import Header from './components/header';
import NavPane from './components/nav-pane';
import Doc from './components/doc';
import CommentPane from './components/comment-pane';
import Editor from './components/medium-editor';
import caret from './utils/selections';
import {data, lines} from './data/doc-data';
import AppSettings from './data/app-settings';

let settings = Immutable.Map(AppSettings);
//let appState = Immutable.Map();

let DocContainer = React.createClass({

    getInitialState: function() {
        return {
            settings: AppSettings,
            changes: [],
            comments: [],
            lines: [],
            selected: {}
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
                        lines={this.state.lines}
                        comments={this.state.comments}
                        changed={this.addChange}
                        selected={this.updateSelection}
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
        // Wrap highlighted text with span.comment-hl

        
        // Add a line
        let doc = document.getElementById('contents').getBoundingClientRect();
        let selectedLine = caret.getLine(this.state.selected.id, this.state.selected.caret);
        let bottomLine = caret.getLine(this.state.selected.id);
        let offset = (bottomLine - selectedLine) * 20;
        let height = this.state.selected.base - offset;
        let line = {
            startX: 300,
            endX: doc.width + 40,  // 40px right padding on contents
            top: height
        };
        this.setState({lines: self.state.lines.concat([line])});

        // Add comment box
        this.setState({comments: self.state.comments.concat([{top: height - 62}])});
    },

    addChange: function(change) {
        this.setState({changes: self.state.changes.concat([change])});
    },

    updateSelection: function(selection) {
        this.setState({selected: selection});
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
