import React from 'react';
import Title from './title';
import Para from './para';

let Doc = React.createClass({

    render: function() {

        let sections = [];
        let count = 1;
        this.props.doc.content.forEach(function(item) {
            switch(item.type) {
                case 'title':
                    sections.push(<Title id={count++} text={item.text} />);
                    break;
                case 'para':                
                    sections.push(<Para id={count++} text={item.text} />);
                    break;
            }
        });

        return (
            <div className="centre">
                <div className="panel-content">
                    <div className="doc">
                        <h1 id="title">{this.props.doc.title}</h1>
                        {sections}
                    </div>
                </div>
            </div>
        );
    }

});

export default Doc;
