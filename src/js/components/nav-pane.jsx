import React from 'react';

class NavPane extends React.Component {
    render() {
        return (
            <div className="sidepanel left">
                <div className="panel-content">
                    <nav className="bs-docs-sidebar">
                        <ul className="nav nav-stacked fixed">
                            <li>
                              <a href="#title">Title</a>
                            </li>
                            <li>
                                <a href="#section1">Section 1</a>
                                <ul className="nav nav-stacked">
                                    <li><a href="#para1">Para 1</a></li>
                                    <li><a href="#para2">Para 2</a></li>
                                    <li><a href="#para3">Para 3</a></li>
                                    <li><a href="#para4">Para 4</a></li>
                                    <li><a href="#para5">Para 5</a></li>
                                </ul>
                            </li>
                            <li>
                                <a href="#section2">Section 2</a>
                            </li>
                            <li>
                              <a href="#section3">Section 3</a>
                              <ul className="nav nav-stacked">
                                <li><a href="#modals-examples">Examples</a></li>
                                <li><a href="#modals-sizes">Sizes</a></li>
                                <li><a href="#modals-remove-animation">Remove animation</a></li>
                                <li><a href="#modals-related-target">Varying content based on trigger button</a></li>
                                <li><a href="#modals-usage">Usage</a></li>
                                <li><a href="#modals-options">Options</a></li>
                                <li><a href="#modals-methods">Methods</a></li>
                                <li><a href="#modals-events">Events</a></li>
                              </ul>
                            </li>
                            <li>
                              <a href="#section4">Section 4</a>
                              <ul className="nav nav-stacked">
                                <li><a href="#dropdowns-examples">Examples</a></li>
                                <li><a href="#dropdowns-usage">Usage</a></li>
                                <li><a href="#dropdowns-methods">Methods</a></li>
                                <li><a href="#dropdowns-events">Events</a></li>
                              </ul>
                            </li>
                        </ul>
                  </nav>
                </div>
            </div>
        );
    }
}

export default NavPane;
