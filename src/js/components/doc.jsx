import React from 'react';
import Title from './title';
import Para from './para';
import Comment from './comment';
import Line from './line';

let Doc = React.createClass({

    render: function() {

        let sections = [],
            lines = [],
            count = 1,
            changed = this.props.changed,
            selected = this.props.selected;

        // Content
        this.props.doc.content.forEach(function(item) {
            switch(item.type) {
                case 'title':
                    sections.push(
                        <Title
                            id={count++}
                            text={item.text} />
                    );
                    break;
                case 'para':                
                    sections.push(
                        <Para
                            id={count++}
                            text={item.text}
                            changed={changed}
                            selected={selected} />
                    );
                    break;
            }
        });

        // Lines
        this.props.lines.forEach(function(line) {
            lines.push(<Line startX={line.startX} endX={line.endX} top={line.top} />);
        });

        return (
            <div className="centre">
                <div className="panel-content" id="doc">
                    <div className="doc">
                        <div className="contents" id="contents">
                            <h1 id="title">{this.props.doc.title}</h1>
                            {sections}
                        </div>
                        <div className={'comments' + (!this.props.showComments ? ' comments-hide' : '')} id="comments">
                            <Comment commentText={'Comment'} />
                        </div>
                        {lines}
                    </div>
                </div>
            </div>
        );
    }

});

export default Doc;
