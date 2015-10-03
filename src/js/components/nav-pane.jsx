import React from 'react';

let NavPane = React.createClass({

    // let sections = [];
    // let count = 1;
    // this.props.doc.content.forEach(function(item) {
    //     switch(item.type) {
    //         case 'title':
    //             sections.push({(count > 1) ? '</li>' : '')}<li><a href={'#' + count++}>{item.text}</a>);
    //             break;
    //         case 'para':                
    //             sections.push(<Para id={count++} text={item.text} />);
    //             break;
    //     }
    // });

    render: function() {
        return (
            <div className={this.props.show ? 'sidepanel left' : 'sidepanel left flex-hide'}>
                <div className="panel-content">
                    <nav className="bs-docs-sidebar">
                        <ul className="nav nav-stacked fixed">
                            <li>
                              <a href="#title">Title</a>
                            </li>

                            <li>
                                <a href="#1">Section 1</a>
                                <ul className="nav nav-stacked">
                                    <li><a href="#2">Para 1</a></li>
                                    <li><a href="#3">Para 2</a></li>
                                    <li><a href="#4">Para 3</a></li>
                                    <li><a href="#5">Para 4</a></li>
                                    <li><a href="#6">Para 5</a></li>
                                </ul>
                            </li>

                        </ul>
                  </nav>
                </div>
            </div>
        );
    }

});

export default NavPane;
