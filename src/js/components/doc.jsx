import React from 'react';
import EditButtons from './edit-buttons';

class Doc extends React.Component {
    render() {

        var sections = [];
        this.props.doc.content.forEach(function(item) {
            switch(item.type) {
                case 'title':
                    sections.push(<h2>{item.text}</h2>);
                    break;
                case 'para':
                    sections.push(
                        <a className="editable" onclick="this.setAttribute('data-state', this.getAttribute('data-state') === 'show' ? 'hide' : 'show');">
                            <EditButtons />
                            <p>{item.text}</p>
                        </a>
                    );
                    break;
            }
        });

        return (
            <div className="doc-pane">
                <div className="panel-content">
                    <div className="doc">
                        <h1 id="title">{this.props.doc.title}</h1>
                        {sections}
                    </div>
                </div>
            </div>
        );
    }
}

export default Doc;
