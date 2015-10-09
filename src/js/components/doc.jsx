import React from 'react';
import Title from './title';
import Para from './para';
import Comment from './comment';

let Doc = React.createClass({

    render: function() {

        let sections = [];
        let count = 1;
        let changed = this.props.changed;

        this.props.doc.content.forEach(function(item) {
            switch(item.type) {
                case 'title':
                    sections.push(<Title id={count++} text={item.text} />);
                    break;
                case 'para':                
                    sections.push(<Para id={count++} text={item.text} changed={changed}/>);
                    break;
            }
        });

        return (
            <div className="centre">
                <div className="panel-content" id="doc">
                    <div className="doc">
                        <div className="contents">
                            <h1 id="title">{this.props.doc.title}</h1>
                            {sections}
                        </div>
                        <div className={(!this.props.showComments) ? 'hide ' : '' + 'comments'}>
                            <Comment commentText={'Comment'} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

export default Doc;
