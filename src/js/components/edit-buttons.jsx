import React from 'react';

class EditButtons extends React.Component {
    render() {
        return (
            <div className="btn-group btn-group-xs edit-group" role="group" aria-label="...">
                <button type="button" className="btn btn-primary" aria-label="move text" onclick="console.log('Move');">
                    <span className="glyphicon glyphicon-move" aria-hidden="true"></span>
                </button>
                <button type="button" className="btn btn-primary" aria-label="delete text" onclick="console.log('Delete');">
                    <span className="glyphicon glyphicon-trash" aria-hidden="true"></span>
                </button>
            </div>
        );
    }
}

export default EditButtons;
