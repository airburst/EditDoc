import React from 'react';
import Immutable from 'immutable';
import Header from './components/header';
import NavPane from './components/nav-pane';
import Doc from './components/doc';
import CommentPane from './components/comment-pane';
import Editor from './components/medium-editor';
import selection from './utils/selections';
import {data, lines} from './data/doc-data';
import AppSettings from './data/app-settings';

let settings = Immutable.Map(AppSettings);
//let appState = Immutable.Map();

let DocContainer = React.createClass({

    getInitialState: function() {
        return {
            data: data,
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
                        doc={this.state.data}
                        show={this.state.settings.showNav} />
                    <Doc
                        doc={this.state.data}
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
        let coords = selection.coordinates(
            this.state.selected.id,
            this.state.selected.text,
            this.state.selected.position
        );
        let height = coords.y - 50 + document.getElementById('doc').scrollTop; // -50px top padding 

        // Add a line
        let doc = document.getElementById('contents').getBoundingClientRect();
        // let selectedLine = selection.getLine(this.state.selected.id, this.state.selected.position);
        // let bottomLine = selection.getLine(this.state.selected.id);
        // let offset = (bottomLine - selectedLine) * 20;
        // let height = this.state.selected.base - offset;
        let line = {
            startX: coords.x - 480, // ONLY if navbar is displayed!!
            endX: doc.width + 41,   // +40px right padding on contents, 1px border on comments
            height: height
        };
        this.setState({lines: self.state.lines.concat([line])});

        // Add comment box
        this.setState({comments: self.state.comments.concat([{height: height - 60}])});
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
