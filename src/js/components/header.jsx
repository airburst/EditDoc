import React from 'react';

class Header extends React.Component {
    render() {
        return (
            <header>
                <nav className="navbar navbar-default navbar-fixed-top" role="navigation">
                    <div className="navbar-header">
                        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#navbar-collapse-1">
                            <span className="sr-only">Toggle navigation</span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                            <span className="icon-bar"></span>
                        </button>
                        <a className="navbar-brand" href="#">Document Editor</a>
                    </div>
                    <div className="collapse navbar-collapse navbar-ex1-collapse">
                        <ul id="mainmenu" className="nav navbar-nav">
                            <li className="dropdown">
                                <a href="#" className="dropdown-toggle" data-toggle="dropdown">File <b className="caret"></b></a>
                                <ul className="dropdown-menu">
                                    <li><a id="save-json" href="#" onclick="console.log('Missing action');"><span className="glyphicon glyphicon-save"></span> Save</a></li>
                                </ul>
                            </li>
                        </ul>
                        <div className="navbar-form">
                            <div className="navbar-spacer"></div>
                            <div className="navbar-buttons-right">
                                <div className="btn-group">
                                    <button 
                                        id="show-nav-button" 
                                        className={this.props.settings.showNav ? 'btn btn-default btn-toggle active' : 'btn btn-default btn-toggle'}
                                        onclick="console.log('Toggle navigation');">
                                        <i className="fa fa-bars"></i> Navigation
                                    </button>
                                    <button 
                                        id="show-comments-button" 
                                        className={this.props.settings.showComments ? 'btn btn-default btn-toggle active' : 'btn btn-default btn-toggle'}
                                        onclick="console.log('Toggle comments');">
                                        <i className="fa fa-comments"></i> Comments
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </nav>
            </header>
        );
    }
}

export default Header;
